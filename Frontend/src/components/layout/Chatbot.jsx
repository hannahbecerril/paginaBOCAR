// components/layout/Chatbot.jsx
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, RefreshCw, Sparkles } from 'lucide-react';

// ── Simulated response engine ─────────────────────────────────────────────────

const RESPONSES = {
    industrialization: [
        { k: ['help', 'what can'],     r: 'I can help you with RFQ creation, draft status, technical specs, approval status, and Industrialization workflows. What do you need?' },
        { k: ['create', 'new rfq'],    r: 'To create a new RFQ, go to **Create RFQ** in the top navigation. Fill in the tool name, type (mold or die), technical specs, and upload a Technical PDF and CAD file before submitting for approval.' },
        { k: ['draft', 'status'],      r: 'Your active drafts are listed in **Drafts**. Look for the "Submitted for Approval" column — a yellow "Yes" means the RFQ is waiting for an Ind. Admin to review it.' },
        { k: ['submit', 'approval'],   r: 'Click into a draft RFQ → Edit stage 1 → fill specs → click **Submit for Approval**. An Ind. Admin will then review it and either approve or return it with comments.' },
        { k: ['approve', 'rejected'],  r: 'If an admin rejected your RFQ, it returns to your drafts with "Submitted for Approval" = No. Open it, make the requested corrections, then resubmit.' },
        { k: ['deadline', 'due'],      r: 'Quote deadlines for each RFQ are set in the technical spec fields (DTQ for molds, DTQB for dies). Check your Calendar section for upcoming deadlines.' },
        { k: ['mold', 'die'],          r: 'Mold RFQs use MOLD_INFO_P1 and P2 specs. Die RFQs use DIE_TRIM_I. Choose the correct type in step 1 of the Create RFQ form — it cannot be changed after creation.' },
        { k: ['file', 'pdf', 'cad'],   r: 'Technical PDF and CAD/3D Model are **required** to submit for approval. Upload them in step 3 of the Create RFQ form. Supported formats: PDF, STEP, STL, DWG.' },
        { k: ['progress', 'complete'],  r: 'The progress bar in Drafts shows how many required fields are filled (DESC, CUST, No_CAV, PPY, TT, ELAB, Smach, DTQ for molds). Fill all 8 fields to reach 100%.' },
    ],
    purchases: [
        { k: ['help', 'what can'],     r: 'I can assist with supplier assignment, quote analysis, RFQ approvals, and Purchases workflows. What would you like to know?' },
        { k: ['supplier', 'assign'],   r: 'To assign suppliers, open an RFQ in the **Not Answered RFQs** section → Edit stage 2 → set metadata (deadline, shipping terms, quality) → click **Submit for Approval** or **Send to Suppliers** (admin).' },
        { k: ['not answered', 'inbox'], r: '**Not Answered RFQs** are RFQs that arrived from Industrialization and haven\'t had suppliers assigned yet. They have status "sent_to_purchases".' },
        { k: ['draft', 'purchases'],   r: '**Drafts** shows RFQs in status "purchases_draft" — you\'ve assigned suppliers and submitted for admin review. The "Submitted for Approval" badge shows which are pending admin action.' },
        { k: ['approve', 'send supplier'], r: 'Purchases Admins see "Send to Suppliers" and "Discard" buttons in Drafts for RFQs marked as submitted. "Send to Suppliers" publishes to the supplier portal immediately.' },
        { k: ['quote', 'compare'],     r: 'Once suppliers respond, the RFQ advances to "waiting_for_suppliers". Open the RFQ detail to see all quotes in Stage 3 with a side-by-side comparison.' },
        { k: ['winner', 'select'],     r: 'In the Stage 3 panel of an RFQ detail, expand a supplier\'s cost breakdown and click **Select as Winner**. The RFQ moves to "supplier_selected" status.' },
        { k: ['final', 'award', 'close'], r: 'Purchases Admins see "Final Award — Close RFQ" in the action bar for "supplier_selected" RFQs. Approving closes the RFQ permanently.' },
        { k: ['deadline', 'response'], r: 'Set the **Response Deadline** in stage 2 metadata. This is communicated to suppliers as the date they must respond by.' },
    ],
    suppliers: [
        { k: ['help', 'what can'],     r: 'I can guide you through quoting, deadlines, RFQ status, and the supplier portal. What do you need help with?' },
        { k: ['quote', 'submit', 'respond'], r: 'Open an RFQ from **Drafts** or **Not Answered**, scroll to Stage 3 and fill out the quote form. Mold quotes have 5 parts; die quotes have 4. You can save as draft first.' },
        { k: ['deadline', 'due'],      r: 'Your upcoming deadlines are visible in the **Calendar** section. They\'re pulled from the response_deadline field set by the Purchases team.' },
        { k: ['draft', 'rfq'],         r: '**Drafts** shows RFQs where you\'re invited but haven\'t responded yet. **Not Answered RFQs** shows the same list — both are your active quote opportunities.' },
        { k: ['all rfq', 'history'],   r: '**All RFQs** shows your complete history: RFQs you\'ve responded to, ones where you won, and ones that closed. Use the status filter to find specific ones.' },
        { k: ['selected', 'winner'],   r: 'If you\'re selected as the winner, the RFQ status changes to "Supplier Selected" and your quote card shows "✅ Selected". Congratulations!' },
        { k: ['not selected', 'lost'], r: 'If another supplier was selected, the status shows "Not Selected". You can review the RFQ history in **All RFQs** for future reference.' },
        { k: ['price', 'cost'],        r: 'The quote form asks for a detailed cost breakdown. Fill in as many fields as possible — Purchases teams compare all submitted quotes side by side.' },
    ],
};

const FALLBACKS = [
    'I don\'t have specific information about that, but I\'m here to help with RFQ workflows, deadlines, and system navigation. Could you rephrase your question?',
    'That\'s outside my current knowledge. Try asking about RFQ creation, approval workflows, supplier quotes, or deadlines.',
    'I\'m not sure about that one. I\'m best at helping with BOCAR procurement workflows — RFQs, quotes, approvals, and status tracking.',
];

function getResponse(text, role) {
    const lower = text.toLowerCase();
    const rules = RESPONSES[role] ?? RESPONSES.industrialization;
    for (const rule of rules) {
        if (rule.k.some(k => lower.includes(k))) return rule.r;
    }
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

function formatMsg(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// ── Quick prompts per role ─────────────────────────────────────────────────────
const QUICK_PROMPTS = {
    industrialization: ['How do I create an RFQ?', 'What does the progress bar mean?', 'Why was my RFQ rejected?', 'How do I submit for approval?'],
    purchases:         ['How do I assign suppliers?', 'What are Not Answered RFQs?', 'How do I send to suppliers?', 'How do I select a winner?'],
    suppliers:         ['How do I submit a quote?', 'Where are my deadlines?', 'What does "Supplier Selected" mean?', 'How do I see my quote history?'],
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function Chatbot({ userRole = 'industrialization' }) {
    const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const userName = storedUser.username ?? 'User';

    const [messages, setMessages] = useState([
        {
            id: 0,
            role: 'bot',
            text: `Hi ${userName}! I'm your BOCAR Procurement Assistant 👋\n\nI can help you with RFQ workflows, deadlines, approvals, and system navigation. What can I help you with today?`,
            time: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const send = (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const userMsg = { id: Date.now(), role: 'user', text: trimmed, time: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        setTimeout(() => {
            const botText = getResponse(trimmed, userRole);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: botText, time: new Date() }]);
            setIsTyping(false);
        }, 600 + Math.random() * 600);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
    };

    const reset = () => {
        setMessages([{
            id: 0, role: 'bot',
            text: `Chat cleared. How can I help you, ${userName}?`,
            time: new Date(),
        }]);
        setInput('');
    };

    const prompts = QUICK_PROMPTS[userRole] ?? QUICK_PROMPTS.industrialization;

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Sparkles size={20} style={{ color: 'var(--brand-accent)' }} />
                            Procurement Assistant
                        </h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            AI-powered help for BOCAR procurement workflows
                        </p>
                    </div>
                    <button
                        onClick={reset}
                        className="p-2 hover:bg-surface-hover transition-colors"
                        style={{ color: 'var(--text-tertiary)' }}
                        title="Clear chat"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto bg-surface border border-border-default p-4 space-y-4 mb-3">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div
                                className="w-8 h-8 flex items-center justify-center flex-shrink-0 border"
                                style={{
                                    backgroundColor: msg.role === 'bot' ? 'var(--brand-accent)' : 'var(--surface-hover)',
                                    borderColor: 'var(--border-default)',
                                }}
                            >
                                {msg.role === 'bot'
                                    ? <Bot size={16} style={{ color: 'white' }} />
                                    : <UserIcon size={14} style={{ color: 'var(--text-primary)' }} />}
                            </div>
                            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                <div
                                    className="px-4 py-2.5 text-sm leading-relaxed"
                                    style={{
                                        backgroundColor: msg.role === 'user' ? 'var(--brand-accent)' : 'var(--background-tertiary)',
                                        color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                        borderRadius: 2,
                                    }}
                                    dangerouslySetInnerHTML={{ __html: formatMsg(msg.text.replace(/\n/g, '<br/>')) }}
                                />
                                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                                    {msg.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 flex items-center justify-center border" style={{ backgroundColor: 'var(--brand-accent)', borderColor: 'var(--border-default)' }}>
                                <Bot size={16} style={{ color: 'white' }} />
                            </div>
                            <div className="px-4 py-3 flex items-center gap-1" style={{ backgroundColor: 'var(--background-tertiary)' }}>
                                {[0,1,2].map(i => (
                                    <span key={i} className="w-1.5 h-1.5 rounded-full inline-block animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: `${i * 0.15}s` }} />
                                ))}
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Quick prompts */}
                <div className="flex gap-2 flex-wrap mb-3">
                    {prompts.map(p => (
                        <button
                            key={p}
                            onClick={() => send(p)}
                            className="px-3 py-1.5 text-xs border transition-colors hover:bg-surface-hover"
                            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me about RFQs, approvals, quotes, deadlines…"
                        rows={2}
                        className="flex-1 px-4 py-2.5 text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-surface"
                        style={{ color: 'var(--text-primary)' }}
                    />
                    <button
                        onClick={() => send(input)}
                        disabled={!input.trim() || isTyping}
                        className="px-4 flex items-center justify-center transition-colors disabled:opacity-40"
                        style={{ backgroundColor: 'var(--brand-accent)', color: 'white' }}
                    >
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-[10px] mt-1.5 text-center" style={{ color: 'var(--text-tertiary)' }}>
                    Press Enter to send · Shift+Enter for new line · Responses are simulated
                </p>
            </div>
        </div>
    );
}
