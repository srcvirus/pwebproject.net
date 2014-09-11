from django.conf.urls import patterns, url

from pweb import views

urlpatterns = patterns('',
    url(r'^getcontent/(?P<device_name>.+)/(?P<vid>\d+)/$', views.getcontent, name='getcontent'),
)

