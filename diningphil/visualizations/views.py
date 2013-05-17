from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.http import HttpResponseRedirect
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.core import serializers
from secretkeys import *
from models import *
import diningphil.settings, diningphil.urls

import oauth2 as oauth
import cgi
import simplejson as json
import urllib2
import re
import gspread
from datetime import datetime
import itertools

# from settings.py
consumer = oauth.Consumer(settings.LINKEDIN_TOKEN, settings.LINKEDIN_SECRET)
client = oauth.Client(consumer)
request_token_url = 'https://api.linkedin.com/uas/oauth/requestToken'
access_token_url = 'https://api.linkedin.com/uas/oauth/accessToken'
authenticate_url = 'https://www.linkedin.com/uas/oauth/authenticate'


# /
def data(request):
    return render_to_response('index.html')
# /login
def oauth_login(request):
    # Step 0. Get the current hostname and port for the callback
    if request.META['SERVER_PORT'] == 443:
     current_server = "https://" + request.META['HTTP_HOST']
    else:
     current_server = "http://" + request.META['HTTP_HOST']
     oauth_callback = current_server + "/login/authenticated"
    # Step 1. Get a request token from Provider.
    resp, content = client.request("%s?oauth_callback=%s" % (request_token_url,oauth_callback), "GET")
    if resp['status'] != '200':
        raise Exception("Invalid response from Provider.")
    # Step 2. Store the request token in a session for later use.
    request.session['request_token'] = dict(cgi.parse_qsl(content))
    # Step 3. Redirect the user to the authentication URL.
    url = "%s?oauth_token=%s" % (authenticate_url,
        request.session['request_token']['oauth_token'])
    print url
    return HttpResponseRedirect(url)


# /home (requires login)
@login_required
def home(request):
    html = "<html><body>"
    token = oauth.Token(request.user.get_profile().oauth_token,request.user.get_profile().oauth_secret)
    client = oauth.Client(consumer,token)
    headers = {'x-li-format':'json'}
    url = "http://api.linkedin.com/v1/people/~:(id,first-name,last-name,headline)"
    resp, content = client.request(url, "GET", headers=headers)
    profile = json.loads(content)
    html += profile['firstName'] + " " + profile['lastName'] + "<br/>" + profile['headline']
    return HttpResponse(html)


# /logout (requires login)
@login_required
def oauth_logout(request):
    # Log a user out using Django's logout function and redirect them
    # back to the homepage.
    logout(request)
    return HttpResponseRedirect('/')

def oauth_authenticated(request):
    # Step 1. Use the request token in the session to build a new client.
    token = oauth.Token(request.session['request_token']['oauth_token'],
        request.session['request_token']['oauth_token_secret'])
    if 'oauth_verifier' in request.GET:
        token.set_verifier(request.GET['oauth_verifier'])
    client = oauth.Client(consumer, token)
    # Step 2. Request the authorized access token from Provider.
    resp, content = client.request(access_token_url, "GET")
    if resp['status'] != '200':
        print content
        raise Exception("Invalid response from Provider.")
    access_token = dict(cgi.parse_qsl(content))
    headers = {'x-li-format':'json'}
    url = "http://api.linkedin.com/v1/people/~:(id,first-name,last-name,industry)"
    token = oauth.Token(access_token['oauth_token'],
        access_token['oauth_token_secret'])
    client = oauth.Client(consumer,token)
    resp, content = client.request(url, "GET", headers=headers)
    profile = json.loads(content)
    # Step 3. Lookup the user or create them if they don't exist.
    firstname = profile['firstName']
    lastname = profile['lastName']
    identifier = profile['id']
    try:
        user = User.objects.get(username=identifier)
    except User.DoesNotExist:
        user = User.objects.create_user(identifier,
            '%s@linkedin.com' % identifier,
            access_token['oauth_token_secret'])
        user.first_name = firstname
        user.last_name = lastname
        user.save()
        # Save our permanent token and secret for later.
        userprofile = UserProfile()
        userprofile.user = user
        userprofile.oauth_token = access_token['oauth_token']
        userprofile.oauth_secret = access_token['oauth_token_secret']
        userprofile.save()
    # Authenticate the user and log them in using Django's pre-built
    # functions for these things.
    user = authenticate(username=identifier,
        password=access_token['oauth_token_secret'])
    login(request, user)
    return HttpResponseRedirect('/')


@login_required
def populate_db(request):
    token = oauth.Token(request.user.get_profile().oauth_token,request.user.get_profile().oauth_secret)
    client = oauth.Client(consumer,token)
    headers = {'x-li-format':'json'}
    gc = gspread.login(GMAIL_USERNAME, GMAIL_PASSWORD)
    #2013 worksheet
    sh = gc.open_by_key('0AqKkQjZRbUBHdENQUHdFX3NQVEZiNDNsa01xWDZWbVE')
    worksheet = sh.get_worksheet(0)
    #get entire worksheet as a list of lists
    thirteen = worksheet.get_all_values()
    for student in thirteen[1:]:
        if student[0]:
            name = student[2].strip()
            timestamp = datetime.strptime(student[0].strip(), '%m/%d/%Y %H:%M:%S')
            position=student[1].strip()
            grad_year = student[3].strip()
            city = student[4].strip()
            major = student[5].strip()
            research = student[6].strip()
            co = student[9].strip()
            startup = student[10].strip()
            try:
                s = Student.objects.get(name = name)
            except Student.DoesNotExist:
                s = Student(name = name, major = major, grad_year = grad_year)
                s.timestamp = timestamp
                s_location, created = City.objects.get_or_create(city_name = city)
                s.location = s_location
                s.position = position
                if co != '':
                    url= "http://api.linkedin.com/v1/company-search:(companies:(name,universal-name,status,industries,employee-count-range,locations))?keywords=%s&count=1&start=0" % (co)
                    resp, content = client.request(url, "GET", headers=headers)
                    company = json.loads(content)
                    try:
                        companies = company['companies']
                        co_name = companies['values'][0]['name']
                        co_type = companies['values'][0]['universalName']
                        co_size = companies['values'][0]['employeeCountRange']['code']
                        c, created = Company.objects.get_or_create(company_name = co_name, company_type = co_type, company_size = co_size)
                        co_industries = companies['values'][0]['industries']['values']
                        for i in co_industries:
                            ind, created = Industries.objects.get_or_create(industry= i['name'])
                            c.industries.add(ind)
                        co_status = companies['values'][0]['status']['name']
                        c.status = co_status
                        try:
                            locations = companies['values'][0]['locations']['values']
                            for l in locations:
                                postal = l['address']['postalCode']
                                city = l['address']['city']
                                loc, created = City.objects.get_or_create(city_name = city)
                                if created:
                                    loc.postal_code = postal
                                    loc.save()
                                c.locations.add(loc)
                                c.save()
                        except:
                            pass
                        c.save()
                        company_assigned = Company.objects.get(company_name=co_name)
                        s.company = company_assigned
                        s.save()
                    except:
                        pass
                if startup != '':
                    s.startup = startup
                if research != '':
                    s.research = research
                s.save()
            else:
                pass
    return HttpResponse("It worked!")

def companies(request):
    students = Student.objects.all()
    company_list = {'A' : {}, 'B' : {}, 'C' : {}, 'D' : {}, 'E' : {}, 'F' : {}, 'G' : {}, 'H' : {}, 'I' : {}}
    research_list = {'research' : {}}
    startup_list = {'startup' : {}}
    full_list = []
    for s in students:
        if s.company:
            company = s.company.company_name
            size = s.company.company_size
            if company in company_list[size]:
                count = company_list[size][company] + 1
                company_list[size][company] = count
            else:
                company_list[size][company] = 1
        elif s.startup:
            startup = s.startup
            if startup in startup_list['startup']:
                count2 = startup_list['startup'][startup] + 1
                startup_list['startup'][startup] = count2
            else:
                startup_list['startup'][startup] = 1
        elif s.research:
            research = s.research
            if research in research_list['research']:
                count3 = research_list['research'][research] + 1
                research_list['research'][research] = count3
            else:
                research_list['research'][research] = 1
    full_list.append(startup_list)
    full_list.append(research_list)
    full_list.append(company_list)
    result = convertToFlare(full_list)
    return HttpResponse(result)

def convertToFlare(dictionary):
    full_list =  dictionary
    final_dict = {"name" : "flare", "children" : []}
    for t in full_list:
        if 'startup' in t:
            startup_dict = {"name" : "Startup", "children" : []}
            for key_s in t['startup']:
                dict_entry = {"name" : key_s, "size" : t['startup'][key_s]}
                startup_dict["children"].append(dict_entry)
            final_dict["children"].append(startup_dict)
        elif 'research' in t:
            research_dict = {"name" : "Research", "children" : []}
            for key_r in t['research']:
                dict_entry = {"name" : key_r, "size" : t['research'][key_r]}
                research_dict["children"].append(dict_entry)
            final_dict["children"].append(research_dict)
        else:
            company_size = t.keys()
            for key2 in company_size:
                company_dict = {"name" : key2, "children" : []}
                for key_c in t[key2]:
                    dict_entry = {"name" : key_c, "size" : t[key2][key_c]}
                    company_dict["children"].append(dict_entry)
                final_dict["children"].append(company_dict)
    return json.dumps(final_dict)


def students(request):
    students = Student.objects.all()
    dictionary_locations = {}
    for s in students:
        city = s.location.city_name
        if city in dictionary_locations:
            count = dictionary_locations[city] + 1
            dictionary_locations[city] = count
        else:
            dictionary_locations[city] = 1
    dictlist = []
    dictlist.append(['Location', 'Number of Penn Students'])
    for key, value in dictionary_locations.iteritems():
        temp = [key,value]
        dictlist.append(temp)
    result = json.dumps(dictlist)
    return HttpResponse(result)

def routes(request):
    companies = Company.objects.all()
    routes = {}
    for c in companies:
        locations = c.locations.all()
        locations_names = []
        for names in locations:
            print names
            locations_names.append(str(names.city_name))
        for pair in itertools.combinations(locations_names, 2):
            if str(pair) in routes:
                pair = str(pair)
                count = routes[pair] + 1
                routes[pair] = count
            else:
                pair = str(pair)
                routes[pair] = 1
    results = json.dumps(routes)
    return HttpResponse(results)