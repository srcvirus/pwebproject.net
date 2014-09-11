from __future__ import division
from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool
from cms.models.pluginmodel import CMSPlugin
from django.conf import settings
import urllib
import datetime
import time
#import cgi

def format_port(n):
    if n:
        return ":" + str(n)
    else:
        return ""

def format_size(size):
    if size > 1024*1024*1024:
        size = size / (1024*1024*1024)
        return "{:n} GiB".format(size)
    elif size > 1024*1024:
        size = size / (1024*1024)
        return "{:n} MiB".format(size)
    elif size > 1024:
        size = size / 1024
        return "{:n} KiB".format(size)
    else:
        return "{:n} bytes".format(size)

class DeviceSearchPlugin(CMSPluginBase):
    model = CMSPlugin
    render_template = "device_search.html"
    
    # Note: When changing Solr field names, the corresponding names need to be
    # updated below (eg 'd_port'), in the template, and in views.py.

    def render(self, context, instance, placeholder):
        try:
            request = context['request']
            query = request.GET['q']

	    #added by nashid for getting parameter from the URL
	    q_page=1
	    results_per_page=10
	    q_rows= str(results_per_page)
	    q_start= '0'
	    if request.method == 'GET' and 'page' in request.GET and 'of' in request.GET:
		try:
			numberofpages= int(request.GET['of']) 
			q_page=int(request.GET['page']) 
	    		if (0<q_page<=numberofpages):		    
			   q_start= str((q_page-1)*results_per_page)
		except ValueError:
			pass	
	    #ends here

#            db = request.GET['db'] NOTE: if uncommenting this, db needs to be soft-coded in the url = line below
        except KeyError:
            return context
        if not query:
            return context
        # Note 1: Three are no checks done on the user input in db and query.
        # A malicious user can issue any command to the Solr core here by 
        # inserting text into the db variable.
        # Note 2: If there is a network error when sending the request to Solr,
        # urlopen() or read() will throw an IOError. This will result in
        # a 500: Internal Server Error page, which is appropriate in this case. 
        url = settings.DEVICE_SEARCH_URL + 'pweb_devices/select?\
wt=python&\
hl=true&\
hl.fl=description,c_content&\
hl.alternateField=description&\
hl.maxAlternateFieldLength=100&\
hl.usePhraseHighlighter=true&\
hl.highlightMultiTerm=true&\
q=' + query +'&\
start=' + q_start+ '&\
rows=' + q_rows+ '&\
sort=r_type asc'
        f = urllib.urlopen(url)
        txt = f.read()
        context['result'] = eval(txt, {"__builtins__":None}, {})
	
	#added by nashid for computing the number pages for the search results
	resultsfound= int(context['result']['response']['numFound'])
	if (resultsfound>0):
		pages=[]
		totalpages=0
		for x in range(0, resultsfound ):
    			if (x%results_per_page==0):
				totalpages=int(x/results_per_page)+1	
				pages.append(totalpages)
		context['page']=pages
		context['totalpage']=totalpages
		context['currentpage']=q_page
		context['previouspage']=q_page-1
		context['nextpage']=q_page+1
	#ends here

        for doc in context['result']['response']['docs']:
            # Add colon to port number
            try:
                doc['d_port'] = format_port(doc['d_port'])
            except KeyError:
                pass # Content results don't have port numbers
	    
	    #added by nashid to retrieve port number from the slor database for each device
	    if doc['r_type']=="content":
		n_context={}
	    	n_url=settings.DEVICE_SEARCH_URL + 'pweb_devices/select?\
wt=python&\
q=d_name:'+ doc['c_device_name']
		n_f = urllib.urlopen(n_url)
        	n_txt = n_f.read()
        	n_context['n_result'] = eval(n_txt, {"__builtins__":None}, {})
		if(int(n_context['n_result']['response']['numFound'])!=0):
			doc['d_port']=format_port(n_context['n_result']['response']['docs'][0]['d_port']) 
	    #ends here

            # Make filesize human readable
            try:
                doc['c_fileszstr'] = format_size(doc['c_filesize'])
            except KeyError:
                pass # Device results don't have file sizes
            # Add titles to untitled text documents
            try:
                if not doc['c_title'] and doc['c_mimetype'] == "text/plain":
                    doc['c_title'] = "Untitled Text Document"
            except KeyError:
                pass # Devices results don't have a title and mimetype
            # Copy over highlighted description
            # Note that Solr escapes HTML characters in the highlighed text by default, except for the
            # <em> tags that it adds, so we can/need to disable Django's automatic
            # escaping using the safe filter in the docmuent template for the
            # description field.
            desc = context['result']['highlighting'][doc['r_key']]['description'][0]
            try:
                if not desc and doc['c_mimetype'] == "text/plain":
                    # If text documents don't have a description, then use the document itself 
                    # for the description
                    desc = context['result']['highlighting'][doc['r_key']]['c_content'][0]
            except KeyError:
                pass # Only content results and text docmuents have c_mimetype and c_content fields
            if len(desc) >= 100:     # The default fragment size returned by the highlighter
                desc = desc + ' ...'
            doc['description'] = desc
        return context

plugin_pool.register_plugin(DeviceSearchPlugin)

class NetworkStatusPlugin(CMSPluginBase):
    model = CMSPlugin
    render_template = "network_status.html"
    
    def render(self, context, instance, placeholder):
        f = urllib.urlopen("http://api.pwebproject.net/hastatus")
        txt = f.read()
        
        #tfstr = '%Y-%m-%d %H:%M:%S {}'.format(localtime().tm_zone)
        
        context['hastatus'] = eval(txt, {"__builtins__":None}, {})
        for status in context['hastatus']:
            for ts in ('discovered_ts', 'lastsuccess_ts', 'lastfailure_ts'):
                if status[ts] == '0':
                    status[ts] = "Never"
                else:
                    #status[ts] = datetime.datetime.fromtimestamp(int(status[ts])/1000).strftime(tfstr)
                    status[ts] = time.strftime('%Y-%m-%d %H:%M:%S %Z', time.localtime(int(status[ts])/1000))
        return context;

plugin_pool.register_plugin(NetworkStatusPlugin)

class GetTextPlugin(CMSPluginBase):
    model = CMSPlugin
    render_template = "gettext.html"

    def render(self, context, instance, placeholder):
        try:
            request = context['request']
            devicename = request.GET['c_device_name']
            cid = request.GET['c_id']
        except KeyError:
            return context
        if not devicename or not cid:
            return context
        url = (settings.DEVICE_SEARCH_URL + 
            'pweb_devices/select?wt=python&q=c_device_name:' + devicename +
            '+AND+c_id:' + cid)
        f = urllib.urlopen(url)
        txt = f.read()
        context['result'] = eval(txt, {"__builtins__":None}, {})
        return context

plugin_pool.register_plugin(GetTextPlugin)

