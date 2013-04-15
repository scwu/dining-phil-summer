from secretkeys import GMAIL_PASSWORD, GMAIL_USERNAME
from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect

from models import *
import diningphil.settings, diningphil.urls

import urllib2
import re
import os, sys, json
import gspread
from datetime import date

def populate_db(request):
    gc = gspread.login(GMAIL_USERNAME, GMAIL_PASSWORD)
    #2013 worksheet
    sh = gc.open_by_key('0AqKkQjZRbUBHdENQUHdFX3NQVEZiNDNsa01xWDZWbVE')
    worksheet = sh.get_worksheet(0)
    #get entire worksheet as a list of lists
    thirteen = worksheet.get_all_values()
    for student in thirteen[1:]:
        if not Student.objects(name=student[2].strip()):
            s = Student(name = student[2].strip(), position=student[1].strip(), timestamp=student[0].strip())
            s.save()
    return HttpResponse("It worked!")



