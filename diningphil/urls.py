from django.conf.urls import patterns, include, url
from django.conf import settings
# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    (r'^_populate_db/', 'diningphil.visualizations.views.populate_db'),
    (r'^companies/', 'diningphil.visualizations.views.companies'),
    (r'^students/', 'diningphil.visualizations.views.students'),
    url(r'^login/?$', 'diningphil.visualizations.views.oauth_login'),
    url(r'^logout/?$', 'diningphil.visualizations.views.oauth_logout'),
    url(r'^login/authenticated/?$', 'diningphil.visualizations.views.oauth_authenticated'),
    url(r'^home/?$','diningphil.visualizations.views.home'),
    url(r'^/?$', 'diningphil.visualizations.views.data'),
    #url(r'^$', 'diningphil.views.home', name='home'),
    # url(r'^diningphil/', include('diningphil.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
    url(r'media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
)
