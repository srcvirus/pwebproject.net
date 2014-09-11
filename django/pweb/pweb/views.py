from django.http import HttpResponseRedirect
from django.conf import settings
import urllib

def getcontent(request, device_name, vid):
    # Note: No security checks done on user input passed to Solr!
    url = (settings.DEVICE_SEARCH_URL + 
           'pweb_devices/select?wt=python&q=d_name:' + device_name)
    f = urllib.urlopen(url)
    txt = f.read()
    result = eval(txt, {"__builtins__":None}, {})
    port = ":" + str(result['response']['docs'][0]['d_port'])
    return HttpResponseRedirect('http://' + device_name + 
                                '.dht.pwebproject.net' + port + 
                                '/' + vid)

