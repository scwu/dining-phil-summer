from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.ForeignKey(User)
    oauth_token = models.CharField(max_length=200)
    oauth_secret = models.CharField(max_length=200)

class City(models.Model):
    city_name = models.CharField(max_length=100, primary_key=True)
    postal_code = models.IntegerField()


class Industries(models.Model):
    industry = models.CharField(max_length=100, primary_key=True)


class Company(models.Model):
    company_name = models.CharField(max_length=300)
    company_type = models.CharField(max_length=200)
    company_size = models.CharField(max_length=3)
    industries = models.ManyToManyField(Industries)
    status = models.CharField(max_length=10)
    locations = models.ManyToManyField(City)


class Student(models.Model):
    name = models.CharField(max_length=300)
    position = models.CharField(max_length=200)
    grad_year = models.IntegerField()
    timestamp = models.DateTimeField()
    major = models.CharField(max_length=300)
    location = models.ForeignKey(City)
    company = models.ForeignKey(Company)
    startup = models.CharField(max_length=200, blank=True, null=True)
    research = models.CharField(max_length=300, blank=True, null=True)
