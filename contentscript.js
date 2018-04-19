var CSPWhitelist = [
  'twitter.com',
  'github.com',
  'gist.github.com',
  'education.github.com',
  'medium.com',
  'npmjs.org',
  'npmjs.com',
  'flickr.com'
];
debugger;
var box = document.getElementById("sociob-toggle");
debugger;
if(box==null || box=='null' || box=='')
{
var extensionOrigin = 'chrome-extension://' + chrome.runtime.id;
if (!location.ancestorOrigins.contains(extensionOrigin)) {
	var Url=window.location.href;
	var host = window.location.host.replace("www.","");
	
		if(CSPWhitelist.indexOf(host)>-1)
		{
		    window.open('https://www.socioleadspro.com/User/Rlogin?windowType=newwin');
		}else{
			/*create iframe element*/
			var iframe = document.createElement('iframe');
			iframe.allowtransparency = 'true';
			iframe.scrolling = 'no';
			// Must be declared at web_accessible_resources in manifest.json
			iframe.src = 'https://www.socioleadspro.com/User/Rlogin';
			//create id of iframe
			iframe.setAttribute("id", "sociob-toggle");
			// Some styles for a fancy sidebar
			iframe.style.cssText = 'border: medium none; height: 100%; width: 100%; position: fixed ! important; z-index: 2147483646; top: 0px; left: 0px; display: block ! important; max-width: 100% ! important; max-height: 100% ! important; padding: 0px ! important; background: rgba(245, 245, 245, 0.74) none no-repeat scroll center center / 40px auto;background: url("https://www.socioleadspro.com/Contents/img/slp_loader.gif") 50% 50% / 40px no-repeat rgba(245, 245, 245, 0.741176);';
			document.body.appendChild(iframe);
			window.onmessage=function(msg) {
			    var fra = document.getElementById("sociob-toggle");
				if(msg.data && msg.data.name=="Close" && msg.source==fra.contentWindow) {
				    fra.style.display = "none";
				  }
				};
	}
}
}else{
box.remove();
}
