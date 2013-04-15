from django.db import models
from mongoengine import *
import diningphil.settings

class City(EmbeddedDocument):
    city_name = StringField(required=True)
    postal_code = IntField(required=True)

class Company(Document):
    company_name = StringField(required=True)
    company_type = StringField()
    company_size = StringField()
    industries = ListField()
    status = StringField()
    locations = ListField(EmbeddedDocumentField(City))

class Student(Document):
    name = StringField(required=True)
    position = StringField(required=True)
    grad_year = IntField()
    timestamp = DateTimeField()
    major = StringField()
    location = ReferenceField(City)
    company = ReferenceField(Company)
    startup = StringField()


