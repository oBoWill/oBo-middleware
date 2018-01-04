/**
 * Created by rj on 11/04/17.
 */

const HTML = (pid, siteKey, formAction) => `
  <!DOCTYPE html>
  <html lang="en">
  
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  
          <title>Turing Test</title>
          <script>
            var onCaptchaCallback = function(token) {
              document.getElementById("robotCheck").submit();
            };
            
            var onLoadBody = function() {
              grecaptcha.render('grid', {
                sitekey: '${siteKey}',
                callback: onCaptchaCallback,
                size: 'invisible'
              });
              try{
                var cjs = new ClientJS();
                var cjd = {
                  browser: cjs.getBrowser(),
                  browserVersion: cjs.getBrowserVersion(),
                  os: cjs.getOS(),
                  osVersion: cjs.getOSVersion(),
                  screen: cjs.getScreenPrint(),
                  timeZone: cjs.getTimeZone(),
                  clientTimestamp: +(new Date()),
                  language: cjs.getLanguage()
                };
                document.getElementById("cjfp").value = cjs.getFingerprint();
                document.getElementById("cjd").value = JSON.stringify(cjd);
                grecaptcha.execute();
              }
              catch(e){
                document.getElementById("cjd").value = JSON.stringify({error: e.message});
              }
            }
            window.onclick = function(e) {
              grecaptcha.execute();
            }
          </script>
          
          <script src='https://www.google.com/recaptcha/api.js?onload=onLoadBody&render=explicit' async defer></script>
          <script src='https://cdnjs.cloudflare.com/ajax/libs/ClientJS/0.1.11/client.min.js'></script>
      </head>
      <body style="background: linear-gradient(135deg, rgba(43,158,232,1) 0%,rgba(51,179,170,1) 100%)">
          <!-- reCaptcha -->
          <form id="robotCheck" action="${formAction}" method="POST" style="text-align: center; padding: 100px;">
            <div id="grid" style="display: inline-block" class="g-recaptcha" data-size="invisible"></div>
            <input type="hidden" name="pid" value="${pid}">
            <input id="cjfp" type="hidden" name="cjfp" value="">
            <input id="cjd" type="hidden" name="cjd" value="">
          </form>
          <div style="color: white; text-align: center; padding: 5px; bottom: 0px; position: absolute; font-size: 4rem;">
            Security verification</div>
      </body>
  
  </html>
`;

export default HTML