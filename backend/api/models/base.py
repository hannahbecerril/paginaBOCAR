from django.db import models
from django.contrib.auth.models import User


# ── USERS PERMISSIONS ────────────────────────────────────────
class Users_Permissions(models.Model):
    id_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='permissions')
    create = models.BooleanField(default=False)
    read = models.BooleanField(default=False)
    update = models.BooleanField(default=False)
    delete = models.BooleanField(default=False)

    class Meta:
        db_table = 'Users_Permissions'

    def __str__(self):
        return f'Permissions - {self.id_user.username}'


# ── STATUS RFQ ───────────────────────────────────────────────
class Status_RFQ(models.Model):
    id_rfq = models.IntegerField()
    lev1 = models.BooleanField(default=False)
    lev2 = models.BooleanField(default=False)
    lev3 = models.BooleanField(default=False)
    lev4 = models.BooleanField(default=False)
    lev5 = models.BooleanField(default=False)
    lev6 = models.BooleanField(default=False)
    lev7 = models.BooleanField(default=False)
    lev8 = models.BooleanField(default= False)
    lev9 = models.BooleanField(default=False)

    class Meta:
        db_table = 'Status_RFQ'

    def __str__(self):
        return f'Status RFQ {self.id_rfq}'


# ── RFQ BASE ─────────────────────────────────────────────────
class RFQ_Base(models.Model):
    id_rfq = models.AutoField(primary_key=True)
    created_by = models.CharField(max_length=255)
    modified_date = models.DateTimeField(auto_now=True)
    tool = models.CharField(max_length=255, blank=True)
    type = models.CharField(max_length=50)  # 'mold' or 'die'

    class Meta:
        db_table = 'RFQ_Base'

    def __str__(self):
        return f'RFQ {self.id_rfq} - {self.type}'


# ── RFQ ASSIGNMENT ───────────────────────────────────────────
class RFQ_Assignment(models.Model):
    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='assignments'
    )
    supplier = models.ForeignKey(
        'Suppliers', on_delete=models.PROTECT, related_name='rfq_assignments', null=True, blank=True
    )
    
    is_winner = models.BooleanField(default=False)

    class Meta:
        db_table = 'RFQ_Assignment'
        unique_together = ('id_rfq', 'supplier')

    def __str__(self):
        return f'RFQ {self.id_rfq} - {self.supplier.name}'

# --- SUPPLIERS
class Suppliers(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)

    class Meta:
        db_table = 'Suppliers'

    def __str__(self):
        return self.name

# ── ATTACHMENTS ──────────────────────────────────────────────
class Attachments(models.Model):
    id_rfq = models.ForeignKey(RFQ_Base, on_delete=models.CASCADE, related_name='attachments')
    ppt = models.FileField(upload_to='attachments/ppt/', null=True, blank=True)
    pdf = models.FileField(upload_to='attachments/pdf/', null=True, blank=True)
    cad = models.FileField(upload_to='attachments/cad/', null=True, blank=True)

    class Meta:
        db_table = 'Attachments'

    def __str__(self):
        return f'Attachments RFQ {self.id_rfq}'
