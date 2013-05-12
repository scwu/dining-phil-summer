from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.ForeignKey(User)
    oauth_token = models.CharField(max_length=200)
    oauth_secret = models.CharField(max_length=200)


class City(models.Model):
    city_name = models.CharField(max_length=100, primary_key=True)
    postal_code = models.IntegerField(blank=True, null=True)

    def __unicode__(self):
        return self.city_name


class Industries(models.Model):
    industry = models.CharField(max_length=100, primary_key=True)

    def __unicode__(self):
        return self.industry


class Company(models.Model):
    company_name = models.CharField(max_length=300, primary_key = True)
    company_type = models.CharField(max_length=200)
    company_size = models.CharField(max_length=3)
    industries = models.ManyToManyField(Industries)
    status = models.CharField(max_length=30)
    locations = models.ManyToManyField(City, blank=True, null=True)

    def __unicode__(self):
        return self.company_name


class Student(models.Model):
    name = models.CharField(max_length=300, primary_key=True)
    position = models.CharField(max_length=200)
    grad_year = models.IntegerField()
    major = models.CharField(max_length=300)
    location = models.ForeignKey(City, blank=True, null=True)
    company = models.ForeignKey(Company, blank=True, null=True)
    startup = models.CharField(max_length=200, blank=True, null=True)
    research = models.CharField(max_length=300, blank=True, null=True)
    timestamp = models.DateTimeField()

    def __unicode__(self):
        return self.name
