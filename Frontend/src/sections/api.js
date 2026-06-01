// api.js — central data layer.
// Every function simulates an async fetch from a JSON file.
// To migrate to real endpoints: replace each function body with a fetch() call.

import rfqsData from './rfqs-data.json';
import usersData from './users-data.json';
import suppliersData from './suppliers-data.json';
import notisData from './notis-data.json';
import dashboardData from './dashboard-data.json';
import rfqFormConfigData from './rfq-form-config.json';
import rfqStatusesData from './rfq-statuses.json';
import notificationConfigData from './notification-config.json';

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

// Exported as a plain object (not async) so context/components can use it synchronously
// as a lookup map. Replace with a real categories endpoint when ready.
export const NOTIFICATION_CATEGORIES = notificationConfigData.categories;

// ── RFQs ─────────────────────────────────────────────────────────────────────

export async function getRFQById(id) {
    await delay();
    return rfqsData.rfqs.find(r => r.id === id) ?? null;
}

// Industrialization views
export async function getIndustrializationAllRFQs() {
    await delay();
    const { allRFQExclude } = rfqStatusesData.industrialization;
    return rfqsData.rfqs.filter(r => !allRFQExclude.includes(r.status.toLowerCase()));
}

export async function getIndustrializationDrafts() {
    await delay();
    const { drafts } = rfqStatusesData.industrialization;
    return rfqsData.rfqs.filter(r => drafts.includes(r.status.toLowerCase()));
}

// Purchases views
export async function getPurchasesAllRFQs() {
    await delay();
    const { allRFQExclude } = rfqStatusesData.purchases;
    return rfqsData.rfqs.filter(r => !allRFQExclude.includes(r.status.toLowerCase()));
}

export async function getPurchasesDrafts() {
    await delay();
    const { drafts } = rfqStatusesData.purchases;
    return rfqsData.rfqs.filter(r => drafts.includes(r.status.toLowerCase()));
}

export async function getPurchasesInbox() {
    await delay();
    const { inbox } = rfqStatusesData.purchases;
    return rfqsData.rfqs.filter(r => inbox.includes(r.status.toLowerCase()));
}

// Suppliers views
export async function getSuppliersAllRFQs() {
    await delay();
    const { allRFQ } = rfqStatusesData.suppliers;
    return rfqsData.rfqs.filter(r => allRFQ.includes(r.status.toLowerCase()));
}

export async function getSuppliersDrafts() {
    await delay();
    const { drafts } = rfqStatusesData.suppliers;
    return rfqsData.rfqs.filter(r => drafts.includes(r.status.toLowerCase()));
}

export async function getSuppliersInbox() {
    await delay();
    const { inbox } = rfqStatusesData.suppliers;
    return rfqsData.rfqs.filter(r => inbox.includes(r.status.toLowerCase()));
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function getUsers() {
    await delay();
    return usersData.users;
}

export async function getUserById(id) {
    await delay();
    return usersData.users.find(u => u.id === id) ?? null;
}

// ── Suppliers ────────────────────────────────────────────────────────────────

export async function getSuppliers() {
    await delay();
    return suppliersData.suppliers;
}

export async function getSupplierById(id) {
    await delay();
    return suppliersData.suppliers.find(s => s.id === id) ?? null;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications(department) {
    await delay();
    return notisData.notifications[department] ?? [];
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardData(timeRange) {
    await delay(500);
    return {
        statusChange: dashboardData.statusChangeData[timeRange],
        rfqDistribution: dashboardData.rfqDistributionData[timeRange],
    };
}

// ── RFQ Form Config ───────────────────────────────────────────────────────────

export async function getRFQFormConfig() {
    await delay();
    return rfqFormConfigData;
}
