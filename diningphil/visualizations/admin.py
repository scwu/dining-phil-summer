from django.contrib import admin
from models import *

class CompanyAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'company_type', 'status')

class StudentAdmin(admin.ModelAdmin):
    list_display = ('name', 'position', 'grad_year', 'major', 'location', 'company')

admin.site.register(City)
admin.site.register(Industries)
admin.site.register(Company, CompanyAdmin)
admin.site.register(Student, StudentAdmin)
