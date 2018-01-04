import axios from 'axios';
import { getAccessToken, getHttpHeaders } from '../utils/httpUtil.js';
import { wrapErrorResponse } from '../utils/errorHandlingUtil.js';
import { apmServiceApiHttpsAgent } from '../security/sslUtil.js';
import jwtDecode from 'jwt-decode';

// API endpoint base constructed from env variables
const { SERVICE_PROTOCOL, SOR_SERVICE_BASE } = process.env;

const SOR_SERVICE_BASE_URL = `${SOR_SERVICE_BASE}/tenants`;
const RECORDS_ENDPOINT = '/{tenant}/xhr/{recordType}/{id?}';
const EXPORT_ENDPOINT = '/{tenant}/{recordType}/export';

// Create api axios instance for signin service.
export const recordService = axios.create({
  httpsAgent: apmServiceApiHttpsAgent,
  // URL endpoint default base.
  baseURL: SOR_SERVICE_BASE_URL,
  // Fails if request takes longer than 7 seconds.
  timeout: process.env.DEFAULT_CONNECTION_TIMEOUT,
});

export const getSORSchema = function (req, recordType, callback) {
  let accessToken = getAccessToken(req);
  let accessTokenBody = jwtDecode(accessToken);
  let endpoint = `${accessTokenBody.tun}/${recordType}/schema`;
  return recordService({
    method: 'GET',
    url: endpoint,
    headers: getHttpHeaders(req),
  }).then((success) => {
    // console.log("testing ...." + success);
    callback(null, success);
  }).catch((failure) => {
    callback(wrapErrorResponse(failure), null);
  });
};

export const getSORRecords = function (req, res) {
  const { tenant, recordType, id } = req.params;
  const { page, size, sort } = req.params;

  let endpoint = `${tenant}/${recordType}${id ? `/${id}` : ''}`;
  return recordService({
    method: 'GET',
    url: endpoint,
    params: req.query,
    headers: getHttpHeaders(req),
  })

    .then(success =>
      // console.log("testing ...." + success);
       res(success.data))

    .catch(failure =>
      // console.log(failure);
       res(wrapErrorResponse(failure)));
};

export const exportRecords = (req, res) => {
  const { tenant, recordType, id } = req.params;

  return recordService({
    method: 'GET',
    url: `${tenant}/${recordType}/export`,
    params: req.query,
    headers: getHttpHeaders(req),
  })
    .then((success) => {
      const result = res(success.data);
      result.type(success.headers['content-type']);
      result.header('Content-Disposition', success.headers['content-disposition']);

      return result;
    })

    .catch(failure =>
      // console.log(failure);
       res(wrapErrorResponse(failure)));
};

export const saveRecord = function (req, res) {
  let { tenant, recordType, id } = req.params;
  let endpoint;

  if(id)
    endpoint = `${tenant}/${recordType}/${id}`;
  else
      endpoint = `${tenant}/${recordType}`;


  let { copyFrom } = req.payload;
  if(copyFrom) {
    return recordService({
      method: 'POST',
      url: endpoint,
      params: req.payload,
      headers: getHttpHeaders(req),
      data: {},
    })

          .then(success => res(success.data))

          .catch((failure) => {
            console.log('FAILURE:', failure);
            return res(wrapErrorResponse(failure));
          });

  } else {
    return recordService({
      method: 'POST',
      url: endpoint,
      data: req.payload,
      headers: getHttpHeaders(req),
    })

          .then(success => res(success.data))

          .catch((failure) => {
            console.log('FAILURE:', failure);
            return res(wrapErrorResponse(failure));
          });
  }
};

export const deleteRecord = function (req, res) {
  let { tenant, recordType, id } = req.params;
  let endpoint = `${tenant}/${recordType}/${id}`;

  console.log('deleting', endpoint);

  return recordService({
    method: 'DELETE',
    url: endpoint,
    headers: getHttpHeaders(req),
  })

    .then(success =>
      // console.log(success);
       res(success.data))

    .catch(failure =>
      // console.log(failure);
       res(wrapErrorResponse(failure)));
};

export const getAttachmentsHandler = function (req, res) {
  let { tenant, recordType, id } = req.params;
  let endpoint;

  endpoint = `${tenant}/${recordType}/${id}/attachments`;

  console.log(endpoint);

  return recordService({
    method: 'GET',
    url: endpoint,
    headers: getHttpHeaders(req),
  })

    .then(success =>
      // console.log(success);
       res(success.data))

    .catch(failure =>
      // console.log(failure);
       res(wrapErrorResponse(failure)));
};

export const saveAttachments = (req, res) => {
  let { tenant, recordType, id } = req.params;

  let endpoint = `/${tenant}/${recordType}/${id}/attachments/`;

  let data = req.payload;

  // NOTE (4/26):
  //
  // This is a workaround for the attachment uploading problem using Node.js's
  // fs and concat-stream modules (which would have to be imported for this to
  // work). It didn't seem to change anything when I tested it, but I'm leaving
  // it here, in case anyone else wants to give it a try:
  //
  // data.pipe(concatStream({encoding: 'buffer'}, data => {
  //   axios.post(endpoint, data, {
  //     headers: data.getHeaders()
  //   })
  // }))

  return recordService({
    method: 'POST',
    url: endpoint,
    data,
    headers: getHttpHeaders(req),
  })

    .then(success => res(success.data))

    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};

export const downloadAttachmentsHandler = (req, res) => {
  const { tenant, recordType, id, fid } = req.params;

  return recordService({
    method: 'GET',
    url: `${tenant}/${recordType}/${id}/attachments/${fid}/download`,
    responseType: 'arraybuffer',
    headers: getHttpHeaders(req, true, [], null),
  }).then((success) => {
    const result = res(success.data);
    result.type(success.headers['content-type']);
    result.header('Content-Disposition', success.headers['content-disposition']);
    return result;
  }).catch(failure => res(wrapErrorResponse(failure)));
};

export const deleteAttachmentsHandler = (req, res) => {
  let { tenant, recordType, id, fid } = req.params;

  return recordService({
    method: 'DELETE',
    url: `${tenant}/${recordType}/${id}/attachments/${fid}`,
    headers: getHttpHeaders(req),
  })
  .then(success => res(success.data))
  .catch(failure => res(wrapErrorResponse(failure)));
};

export const saveComments = (req, res) => {
  let { tenant, recordType, id } = req.params;
  let { replyTo } = req.query;
  let endpoint = `/${tenant}/${recordType}/${id}/comments${replyTo ? `?replyTo=${replyTo}` : ''}`;

  return recordService({
    method: 'POST',
    url: endpoint,
    data: req.payload,
    headers: getHttpHeaders(req),
  })

    .then(success => res(success.data))

    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};

export const updateComments = (req, res) => {
  let { tenant, recordType, id, cid } = req.params;

  let endpoint = `/${tenant}/${recordType}/${id}/comments/${cid}`;

  console.log('update comments endpoint: ', endpoint);

  return recordService({
    method: 'POST',
    url: endpoint,
    data: req.payload,
    headers: getHttpHeaders(req),
  })

    .then(success => res(success.data))

    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};

export const deleteComments = (req, res) => {
  let { tenant, recordType, id, cid } = req.params;

  let endpoint = `/${tenant}/${recordType}/${id}/comments/${cid}`;

  console.log('delete comments endpoint: ', endpoint);

  return recordService({
    method: 'DELETE',
    url: endpoint,
    data: req.payload,
    headers: getHttpHeaders(req),
  })

    .then(success => res(success.data))

    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};

export const getCommentsHandler = function (req, res) {
  let { tenant, recordType, id } = req.params;
  let endpoint;

  endpoint = `${tenant}/${recordType}/${id}/comments`;

  console.log(endpoint);

  return recordService({
    method: 'GET',
    url: endpoint,
    headers: getHttpHeaders(req),
  })

    .then(success =>
      // console.log(success);
       res(success.data))

    .catch(failure =>
      // console.log(failure);
       res(wrapErrorResponse(failure)));
};

export const getUserStoriesHandler = function (req, res) {
  let { tenant, recordType, fid, id } = req.params;
  let { feature } = req.query;
  let endpoint;

  endpoint = `${tenant}/userStories${id ? `/${id}` : (feature ? `?feature=${feature}` : '')}`;

  console.log(endpoint);

  return recordService({
    method: 'GET',
    url: endpoint,
    headers: getHttpHeaders(req),
  })

    .then(success =>
      // console.log(success);
       res(success.data))

    .catch(failure =>
      // console.log(failure);
       res(wrapErrorResponse(failure)));
};

export const saveUserStoriesHandler = function (req, res) {
  let { tenant, recordType, fid, id } = req.params;
  let endpoint;

  endpoint = `${tenant}/userStories${id ? `/${id}` : ''}`;
  const data = { ...req.payload, feature: { id: fid } };
  console.log(endpoint, data);

  return recordService({
    method: 'POST',
    url: endpoint,
    data,
    headers: getHttpHeaders(req),
  })

    .then(success =>
      // console.log(success);
       res(success.data))

    .catch(failure =>
      // console.log(failure);
       res(wrapErrorResponse(failure)));
};

const records = function (server, options, next) {
  let exportRoute = {
    method: 'GET',
    path: EXPORT_ENDPOINT,
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: exportRecords,
    },
  };

  let readRoute = {
    method: 'GET',
    path: RECORDS_ENDPOINT,
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: getSORRecords,
    },
  };

  let writeRoute = {
    method: 'POST',
    path: RECORDS_ENDPOINT,
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: saveRecord,
    },
  };

  let deleteRoute = {
    method: 'DELETE',
    path: RECORDS_ENDPOINT,
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: deleteRecord,
    },
  };

  let attachmentsRoute = {
    method: 'POST',
    path: '/{tenant}/xhr/{recordType}/{id}/attachments',
    config: {
      payload: { parse: false },
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: saveAttachments,
    },
  };


  let commentsRoute = {
    method: 'POST',
    path: '/{tenant}/xhr/{recordType}/{id}/comments',
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: saveComments,
    },
  };

  let commentsUpdateRoute = {
    method: 'POST',
    path: '/{tenant}/xhr/{recordType}/{id}/comments/{cid}',
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: updateComments,
    },
  };

  let commentsDeleteRoute = {
    method: 'DELETE',
    path: '/{tenant}/xhr/{recordType}/{id}/comments/{cid}',
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: deleteComments,
    },
  };


  let getComments = {
    method: 'GET',
    path: '/{tenant}/xhr/{recordType}/{id}/comments',
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: getCommentsHandler,
    },
  };


  let getAttachments = {
    method: 'GET',
    path: '/{tenant}/xhr/{recordType}/{id}/attachments',
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: getAttachmentsHandler,
    },
  };

  let downloadAttachments = {
    method: 'GET',
    path: '/{tenant}/xhr/{recordType}/{id}/attachments/{fid}/download',
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: downloadAttachmentsHandler,
    },
  };

  let deleteAttachments = {
    method: 'DELETE',
    path: '/{tenant}/xhr/{recordType}/{id}/attachments/{fid}',
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: deleteAttachmentsHandler,
    },
  };

  let getUserStories = {
    method: 'GET',
    path: '/{tenant}/xhr/userStories',
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: getUserStoriesHandler,
    },
  };

  let saveUserStories = {
    method: 'POST',
    path: '/{tenant}/xhr/userStories',
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: saveUserStoriesHandler,
    },
  };

  let createUserStory = {
    method: 'POST',
    path: '/{tenant}/xhr/{recordType}/{fid}/userStories',
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'log', // may also be 'ignore' or 'error'
      },
      handler: saveUserStoriesHandler,
    },
  };

  server.route([
    exportRoute,
    readRoute,
    writeRoute,
    deleteRoute,
    attachmentsRoute,
    commentsRoute,
    commentsUpdateRoute,
    commentsDeleteRoute,
    getAttachments,
    downloadAttachments,
    deleteAttachments,
    getComments,
    getUserStories,
    saveUserStories,
    createUserStory,
  ]);

  return next();

};

records.attributes = {
  name: 'records',
  version: '0.0.0',
};

export default { register: records };
