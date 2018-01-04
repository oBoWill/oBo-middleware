import axios from 'axios';

import { getAccessToken, getHttpHeaders } from '../utils/httpUtil.js';
import { wrapErrorResponse } from '../utils/errorHandlingUtil.js';
import { apmServiceApiHttpsAgent } from '../security/sslUtil.js';

const { SERVICE_PROTOCOL, SURVEY_SERVICE_BASE } = process.env;

const SURVEY_SERVICE_BASE_URL = `${ SURVEY_SERVICE_BASE }/tenants`;

// Create api axios instance for survey service.
export const surveyService = axios.create({
  httpsAgent: apmServiceApiHttpsAgent,
  // URL endpoint default base.
  baseURL: SURVEY_SERVICE_BASE_URL,
  // Fails if request takes longer than 7 seconds.
  timeout: process.env.DEFAULT_CONNECTION_TIMEOUT,
});

// returns surveys in pagination w/ params (page, size)
export const getPagedSurveys = (req, res) => {
  let { tenant, page, size, id } = req.params;

  let endpoint = `${tenant}/surveys`;
  if(id)
    endpoint = `${tenant}/surveys/${id}`;

  return surveyService({
    method: 'GET',
    url: endpoint,
    params: req.query || undefined,
    headers: getHttpHeaders(req),
  })
    .then((success) => {
      // console.log('success:', success);
      return res(success.data);
    })
    .catch((failure) => {
      // console.log('failed!', failure)
      return res(wrapErrorResponse(failure));
    });
}


export const newSurvey = (req, res) => {
  let { copyFrom, name, description, audienceType, templateId } = req.payload;
  let { tenant } = req.params;

  let client;
  // copy from another survey
  if(copyFrom) {
    client = surveyService({
      method: 'POST',
      url: `${ tenant }/surveys`,
      params: { copyFrom: `/surveys/${copyFrom}` },
      headers: getHttpHeaders(req),
      data: {},
    });
  } else if(templateId) {
    client = surveyService({
      method: 'POST',
      url: `${tenant}/surveys`,
      params: { copyFrom: `/surveyTemplates/${templateId}` },
      data: {
        name,
        description,
        audienceType,
      },
      headers: getHttpHeaders(req),
    });
  } else {
    client = surveyService({
      method: 'POST',
      url: `${tenant}/surveys`,
      data: {
        name,
        description,
        audienceType,
      },
      headers: getHttpHeaders(req),
    });
  }
  return client.then((success) => {
    return res(success.data);
  })
  .catch((failure) => {
    return res(wrapErrorResponse(failure));
  });
}

export const deleteSurvey = (req, res) => {
  let { tenant, id } = req.params;

  return surveyService({
    method: 'DELETE',
    url: `${ tenant }/surveys/${ id }`,
    headers: getHttpHeaders(req),
  })
  .then((success) => {
    return res(success.data);
  })
  .catch((failure) => {
    // console.log('failed!', failure)
    return res(wrapErrorResponse(failure));
  });
}


export const updateSurvey = (req, res) => {
  let payload = req.payload;
  let { tenant, id } = req.params;

  return surveyService({
    method: 'POST',
    url: `${ tenant }/surveys/${ id }`,
    headers: getHttpHeaders(req),
    data: payload,
  })
  .then((success) => {
    return res(success.data);
  })
  .catch((failure) => {
    // console.log('failed!', failure)
    return res(wrapErrorResponse(failure));
  });
}



export const getSurveyDesign = (req, res) => {
  let { tenant, id } = req.params;

  return surveyService({
    method: 'GET',
    url: `${ tenant }/surveys/${ id }/design`,
    headers: getHttpHeaders(req),
  })
  .then((success) => {
    return res(success.data);
  })
  .catch((failure) => {
    // console.log('failed!', failure)
    return res(wrapErrorResponse(failure));
  });
}


export const updateSurveyDesign = (req, res) => {
  let { tenant, id } = req.params;

  return surveyService({
    method: 'POST',
    url: `${ tenant }/surveys/${ id }/design`,
    headers: getHttpHeaders(req),
    data: req.payload,
  })
  .then((success) => {
    return res(success.data);
  })
  .catch((failure) => {
    // console.log('failed!', failure)
    return res(wrapErrorResponse(failure));
  });
}

export const getSurveyDetails = (req, res) => {
  let { tenant, id } = req.params;

  return surveyService({
    method: 'GET',
    url: `${ tenant }/surveys/${ id }/details`,
    headers: getHttpHeaders(req),
  })
    .then((success) => {
      return res(success.data);
    })
    .catch((failure) => {
      // console.log('failed!', failure)
      return res(wrapErrorResponse(failure));
    });
}

export const updateSurveyDetails = (req, res) => {
  let { tenant, id } = req.params;

  return surveyService({
    method: 'POST',
    url: `${ tenant }/surveys/${ id }/details`,
    headers: getHttpHeaders(req),
    data: req.payload,
  })
    .then((success) => {
      return res(success.data);
    })
    .catch((failure) => {
      // console.log('failed!', failure)
      return res(wrapErrorResponse(failure));
    });
}

export const getSurveyParticipants = (req, res) => {
  let { tenant, id } = req.params;

  return surveyService({
    method: 'GET',
    url: `${ tenant }/surveys/${ id }/participants`,
    headers: getHttpHeaders(req),
  })
  .then((success) => {
    let data = success.data;
    let criteria = data['criteria']

    criteria['numberParticipants'] = data.numberExpectedRespondents,
    criteria['estimatedTimeInMinute'] = data.estimatedTimeInMinute

    for (var i in data) {
      if (i != 'criteria') {
       criteria[i] = data[i];
      }
    }
    console.log(criteria)
    return res(data);
  })
  .catch((failure) => {
    // console.log('failed!', failure)
    return res(wrapErrorResponse(failure));
  });
}

export const updateSurveyParticipants = (req, res) => {
  let { tenant, id } = req.params;

  let pl = req.payload;

  let data = {
    numberExpectedRespondents: pl.numberTargetedResponses,
    estimatedTimeInMinute: pl.estimatedTimeInMinute,
    criteria: pl
  }

  for (var i in pl) {
    data[i] = pl[i];
  }
  return surveyService({
    method: 'POST',
    url: `${ tenant }/surveys/${ id }/participants`,
    headers: getHttpHeaders(req),
    data: data
  })
  .then((success) => {
    return res(success.data);
  })
  .catch((failure) => {
    // console.log('failed!', failure)
    return res(wrapErrorResponse(failure));
  });
}


export const updateEstimate = (req, res) => {
  let { tenant, id } = req.params;

  return surveyService({
    method: 'POST',
    url: `${ tenant }/surveys/${ id }/estimate`,
    headers: getHttpHeaders(req),
    data: req.payload
  })
  .then((success) => {
    let data = success.data;
    let criteria = data['criteria']
    if(criteria) {
      for(var i in data) {
        if(i !== 'criteria') {
          criteria[i] = data[i];
        }
      }
    }
    console.log(criteria)
    return res(criteria);
  })
  .catch((failure) => {
    console.log('failed!', failure)
    return res(wrapErrorResponse(failure));
  });
}


export const runSurveyAction = (req, res) => {
  let { tenant, id } = req.params;
  console.log('run action',req.payload)

  return surveyService({
    method: 'POST',
    url: `${ tenant }/surveys/${ id }/actions`,
    headers: getHttpHeaders(req),
    params: req.payload
  })
  .then((success) => {
    return res(success.data);
  })
  .catch((failure) => {
    // console.log('failed!', failure)
    return res(wrapErrorResponse(failure));
  });
};


export const getSurveyComments = (req, res) => {
  let { tenant, id } = req.params;

  let endpoint;

  endpoint = `${tenant}/surveys/${id}/comments`;

  return surveyService({
    method: 'GET',
    url: endpoint,
    headers: getHttpHeaders(req),
  })

    .then((success) => {
      // console.log(success);
      return res(success.data);
    })

    .catch((failure) => {
      // console.log(failure);
      return res(wrapErrorResponse(failure));
    });
};

export const createSurveyComments = (req, res) => {
  let { tenant, id } = req.params;
  let { replyTo } = req.query;

  let endpoint = `/${tenant}/surveys/${id}/comments${replyTo ? `?replyTo=${replyTo}` : ''}`;

  return surveyService({
    method: 'POST',
    url: endpoint,
    data: req.payload,
    headers: getHttpHeaders(req),
  })

    .then((success) => {
      return res(success.data);
    })

    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};


export const updateSurveyComment = (req, res) => {
  let { tenant, id, cid } = req.params;

  let endpoint = `/${tenant}/surveys/${id}/comments/${cid}`;

  return surveyService({
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

export const deleteSurveyComments = (req, res) => {
  let { tenant, id, cid } = req.params;

  let endpoint = `/${tenant}/surveys/${id}/comments/${cid}`;

  return surveyService({
    method: 'DELETE',
    url: endpoint,
    headers: getHttpHeaders(req),
  })

    .then(success => res(success.data))

    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};

export const getSurveyAttachments = function (req, res) {
  let { tenant, id } = req.params;
  let endpoint;

  endpoint = `${tenant}/surveys/${id}/attachments`;

  return surveyService({
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

export const uploadSurveyAttachment = (req, res) => {
  let { tenant, id } = req.params;

  let endpoint = `/${tenant}/surveys/${id}/attachments/`;
  let data = req.payload;

  return surveyService({
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

export const downloadSurveyAttachment = (req, res) => {
  const { tenant, id, fid } = req.params;

  return surveyService({
    method: 'GET',
    url: `${tenant}/surveys/${id}/attachments/${fid}/download`,
    responseType: 'arraybuffer',
    headers: getHttpHeaders(req),
  }).then((success) => {
    const result = res(success.data);
    result.type(success.headers['content-type']);
    result.header('Content-Disposition', success.headers['content-disposition']);
    return result;
  }).catch(failure => res(wrapErrorResponse(failure)));
};

export const deleteSurveyAttachment = (req, res) => {
  let { tenant, id, fid } = req.params;

  return surveyService({
    method: 'DELETE',
    url: `${tenant}/surveys/${id}/attachments/${fid}`,
    headers: getHttpHeaders(req),
  })
  .then(success => res(success.data))
  .catch(failure => res(wrapErrorResponse(failure)));
};

export const createSurveyPanel = (req, res) => {
  let { tenant, id } = req.params;

  return surveyService({
    method: 'POST',
    url: `/${ tenant }/surveys/${ id }/panel`,
    headers: getHttpHeaders(req),
    data: req.payload,
  })
    .then((success) => {
      return res(success.data);
    })
    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};

export const getSurveyPanel = (req, res) => {
  let { tenant, id } = req.params;

  return surveyService({
    method: 'GET',
    url: `/${ tenant }/surveys/${ id }/panel`,
    headers: getHttpHeaders(req),
  })
    .then((success) => {
      return res(success.data);
    })
    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};

export const getSurveyPanelInfo = (req, res) => {
  let { tenant, id, type } = req.params;

  return surveyService({
    method: 'GET',
    url: `/${ tenant }/surveys/${ id }/panel/${ type }`,
    headers: getHttpHeaders(req),
  })
    .then((success) => {
      return res(success.data);
    })
    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};

export const getSurveyExport = (req, res) => {
  let { tenant, id } = req.params;
  const url = `/${ tenant }/surveys/${ id }/responses/export`;
  return surveyService({
    method: 'GET',
    url,
    headers: getHttpHeaders(req),
  })
    .then((success) => {
      const result = res(success.data);
      result.type(success.headers['content-type']);
      result.header('Content-Disposition', success.headers['content-disposition']);

      return result;
    })
    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};

export const getSurveyResponses = (req, res) => {
  let { tenant, id, rid } = req.params;
  const url = `/${ tenant }/surveys/${ id }/responses${rid ? `/${rid}` : ''}`;
  return surveyService({
    method: 'GET',
    url,
    params: req.query,
    headers: getHttpHeaders(req),
  })
    .then((success) => {
      return res(success.data);
    })
    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};

export const getSurveyTimeline = (req, res) => {
  let { tenant, id } = req.params;
  const url = `/${tenant}/surveys/${id}/timeline`;
  return surveyService({
    method: 'GET',
    url,
    headers: getHttpHeaders(req),
  })
    .then((success) => {
      return res(success.data);
    })
    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};

export const getSurveyAnalysis = (req, res) => {
  let { tenant, id, rid } = req.params;

  const url = `/${ tenant }/surveys/${id}/analysis`;

  return surveyService({
    method: 'GET',
    url,
    headers: getHttpHeaders(req),
  })
    .then((success) => {
      return res(success.data);
    })
    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};

export const getSurveyQuestionAnalysis = (req, res) => {
  let { tenant, id, rid, questionId } = req.params;
  const { to, from } = req.query;
  const url = `/${ tenant }/surveys/${id}/analysis/${questionId}`;

  return surveyService({
    method: 'GET',
    url,
    params: { to, from },
    headers: getHttpHeaders(req),
  })
    .then((success) => {
      return res(success.data);
    })
    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};