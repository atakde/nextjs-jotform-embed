import React, { memo, useEffect, useRef } from 'react';

const defaultEmbedStyle = {
  border: 'none',
  width: '100%',
};

const JotformEmbed = memo(({ src, className, styles, allowScrolling = false }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (global.addEventListener) {
      global.addEventListener('message', handleIframeMessage, false);
    } else if (global.attachEvent) {
      global.attachEvent('onmessage', handleIframeMessage);
    }

    return () => {
      if (global.removeEventListener) {
        global.removeEventListener('message', handleIframeMessage, false);
      } else if (global.detachEvent) {
        global.detachEvent('onmessage', handleIframeMessage);
      }
    };
  }, []);


  const isPermitted = (originUrl, whiteListedDomains) => {
    const url = document.createElement('a');
    url.href = originUrl;
    const hostname = url.hostname;
    let result = false;
    if (typeof hostname !== 'undefined') {
      whiteListedDomains.forEach(function (element) {
        if (hostname.slice((-1 * element.length - 1)) === '.'.concat(element) || hostname === element) {
          result = true;
        }
      });
      return result;
    }
  }

  const isJotformOrigin = origin => {
    return origin.indexOf('jotform') > -1;
  };

  const handleIframeMessage = e => {
    if (typeof e.data === 'object') {
      return;
    }

    const args = e.data.split(":");
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }

    switch (args[0]) {
      case "scrollIntoView":
        iframe.scrollIntoView();
        break;
      case "setHeight":
        iframe.style.height = args[1] + "px";
        console.log("setHeight");
        if (!isNaN(args[1]) && parseInt(iframe.style.minHeight) > parseInt(args[1])) {
          console.log("setHeight");
          iframe.style.minHeight = args[1] + "px";
        }
        break;
      case "collapseErrorPage":
        if (iframe.clientHeight > window.innerHeight) {
          iframe.style.height = window.innerHeight + "px";
        }
        break;
      case "reloadPage":
        window.location.reload();
        break;
      case "loadScript":
        if (!isPermitted(e.origin, ['jotform.com', 'jotform.pro'])) { break; }
        let src = args[1];
        if (args.length > 3) {
          src = args[1] + ':' + args[2];
        }
        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        document.body.appendChild(script);
        break;
      case "exitFullscreen":
        if (window.document.exitFullscreen) window.document.exitFullscreen();
        else if (window.document.mozCancelFullScreen) window.document.mozCancelFullScreen();
        else if (window.document.mozCancelFullscreen) window.document.mozCancelFullScreen();
        else if (window.document.webkitExitFullscreen) window.document.webkitExitFullscreen();
        else if (window.document.msExitFullscreen) window.document.msExitFullscreen();
        break;
    }

    if (isJotformOrigin(e.origin) && "contentWindow" in iframe && "postMessage" in iframe.contentWindow) {
      const urls = { "docurl": encodeURIComponent(document.URL), "referrer": encodeURIComponent(document.referrer) };
      iframe.contentWindow.postMessage(JSON.stringify({ "type": "urls", "value": urls }), "*");
    }
  };

  return (
    <iframe
      ref={iframeRef}
      className={className}
      src={src}
      style={{ ...defaultEmbedStyle, ...styles }}
      scrolling={allowScrolling ? 'yes' : 'no'}
    />
  );

});

export { JotformEmbed };