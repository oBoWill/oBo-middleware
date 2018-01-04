/**
 * Created by rj on 11/04/17.
 */

const HTML = (props, title) => `
  <!DOCTYPE html>
  <html lang="en">
  
      <head>
      
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  
          <link href="/__static/surveyHosting/vendor.css" rel="stylesheet" />
          <link href="/__static/surveyHosting/agile-ui.css" rel="stylesheet" />
          <link href="/__static/surveyHosting/index.css" rel="stylesheet" />
  
          <title>${ title }</title>
           
      </head>
  
      <body class="survey-error-body">
        <div class="apm-banner z-depth-1">
          <div class="apm-logo"></div>
        </div>
        
        <div class="error-message">
          <h1>${ props.errorTitle }</h1>
          <p>${ props.errorMessage }</p>
          <p>${ props.errorResolution }</p>
        </div>
        
      </body>
  
  </html>
`;

export default HTML