export const DUMMY_SURVEY_DATA = [
  {
    schema: '/schema/survey',
    id: '1',
    name: 'Project Burgundy Product Research 2',
    status: 'inprogress',
    startAt: 1474416000,
    qualifiedRespondents: 45,
    targetedRespondents: 50,
    link: '/surveys/1'
  },
  {
    schema: '/schema/survey',
    id: '2',
    name: 'Project Melody Feature 1',
    status: 'completed',
    startAt: 1471651200,
    endAt: 1472688000,
    qualifiedRespondents: 100,
    targetedRespondents: 100,
    link: '/surveys/2'
  },
  {
    schema: '/schema/survey',
    id: '3',
    name: 'Project Symphony Research',
    status: 'completed',
    startAt: 1471219200,
    endAt: 1471651200,
    qualifiedRespondents: 65,
    targetedRespondents: 70,
    link: '/surveys/3'
  },
  {
    schema: '/schema/survey',
    id: '4',
    name: 'Project Harmony Research',
    status: 'completed',
    startAt: 1470009600,
    endAt: 1471219200,
    qualifiedRespondents: 60,
    targetedRespondents: 60,
    link: '/surveys/4'
  },
  {
    schema: '/schema/survey',
    id: '5',
    name: 'Project Burgundy Product Research 1',
    status: 'completed',
    startAt: 1471737600,
    endAt: 1472774400,
    qualifiedRespondents: 60,
    targetedRespondents: 100,
    link: '/surveys/5'
  },
  {
    schema: '/schema/survey',
    id: '6',
    name: 'Project Melody Feature 2',
    status: 'ongoing',
    startAt: 1474329600,
    qualifiedRespondents: 8,
    targetedRespondents: 100,
    link: '/surveys/6'
  },
  {
    schema: '/schema/survey',
    id: '7',
    name: 'Greenfield Customer Research',
    status: 'ongoing',
    startAt: 1473897600,
    qualifiedRespondents: 45,
    targetedRespondents: 60,
    link: '/surveys/7'
  },
  {
    schema: '/schema/survey',
    id: '8',
    name: 'Product Burgundy Product Research',
    status: 'ongoing',
    questions: 9,
    link: '/surveys/8'
  }
];

export const DUMMY_TEMPLATE_DATA = {
  content: [{
    schema: '/schema/surveyTemplate',
    id: '_blank',
    name: 'Blank survey',
    category: '',
    color: 'white'
  }, {
    schema: '/schema/surveyTemplate',
    id: '_ci',
    name: 'Competitive intelligence',
    category: '',
    color: 'pink lighten-2',
    detail: 'Better understand the capabilities and objectives of your competitors by analyzing sales, customers, partners and the market landscape.'
  }, {
    schema: '/schema/surveyTemplate',
    id: '_psp',
    name: 'Product strategy and positioning',
    category: '',
    detail: 'Position your product in the market by defining key value proposition and functional attributes to help develop your strategy.',
    color: 'purple lighten-3'
  }, {
    schema: '/schema/surveyTemplate',
    id: '_pcdf',
    name: 'Product concept and design feedback',
    category: '',
    detail: 'Test your design concepts to gather real user feedback and help ensure an intuitive customer experience.',
    color: 'purple lighten-1'
  }, {
    schema: '/schema/surveyTemplate',
    id: '_ffp',
    name: 'Feature feedback and prioritization',
    category: '',
    detail: 'Gather and assess key product feature functionality feedback to rank and prioritize development actions.',
    color: 'blue'
  }, {
    schema: '/schema/surveyTemplate',
    id: '_cpi',
    name: 'Customer product experience',
    category: '',
    detail: 'Gain actionable user feedback relative to help you identify impactful product adjustments and better understand the customer mindset.',
    color: 'blue lighten-2'
  }]
};

export const DUMMY_SURVEY_DESIGN = {
  title: 'Project Burgundy Product Research',
  introduction: 'This is shown to the respondent and describe the survey',
  sections: [
    {
      label: 'First Section',
      id: 's1',
      questions: [
        {
          id: 6,

          field: 'TEXT_F',
          template: 'SHORT_ANSWER',

          label: 'Text Field',
          description: 'The text field input allows a single line of input, useful for names.',

          placeholder: '',

          value: ''
        },
        {
          id: 7,

          field: 'TEXT_A',
          template: 'LONG_ANSWER',

          label: 'Text Area',
          description: 'The text area component allows for basic editing.',

          placeholder: '',

          value: ''
        },
        {
          id: 8,

          field: 'SELECT',
          template: 'DROPDOWN_SELECT',

          label: 'Dropdown Select',
          description: 'The select component is good for questions with more options.',

          placeholder: '',

          multiple: true,
          search: true,

          options: [
            {
              value: '1',
              label: 'first item'
            },
            {
              value: '2',
              label: 'second item'
            },
            {
              value: '3',
              label: 'third item'
            }
          ],

          value: []

        }
      ]
    },
    {
      name: 'Second Section - Button Inputs',
      id: 's2',
      questions: [
        {
          id: 1,

          field: 'BUTTON',
          template: 'SINGLE_ANSWER',

          label: 'Single Answer',
          description: 'This question requires the user to select only one answer using radio-buttons.',

          multiple: false,
          custom: false,

          options: [
            {
              value: '1',
              label: 'first item'
            },
            {
              value: '2',
              label: 'second item'
            },
            {
              value: '3',
              label: 'third item'
            }
          ]
        },
        {
          id: 2,

          field: 'BUTTON',
          template: 'MULTIPLE_ANSWER',

          label: 'Multiple Answer',
          description: 'This question allows the user to select multiple answers using check-boxes.',

          multiple: true,
          custom: false,

          options: [
            {
              value: '1',
              label: 'first item'
            },
            {
              value: '2',
              label: 'second item'
            },
            {
              value: '3',
              label: 'third item'
            }
          ]
        }
        // {
        //   id: 3,
        //
        //   field: 'MATRIX',
        //   template: 'UP_DOWN_VOTE',
        //
        //   label: 'Up/Down Vote',
        //   description: 'The vote question has users up/down vote using custom icon buttons.',
        //
        //   multiple: false,
        //   custom: false,
        //
        //   options: [
        //     {
        //       label: 'Up',
        //       icon: 'thumb_up'
        //     },
        //     {
        //       label: 'Down',
        //       icon: 'thumb_down'
        //     }
        //   ]
        // },
        // {
        //   id: 4,
        //
        //   field: 'MATRIX',
        //   template: 'LINEAR_SCALE',
        //
        //   label: 'Linear Scale',
        //   description: 'The linear scale has users rank one or more items with the radio-buttons.',
        //
        //   multiple: false,
        //   custom: false,
        //
        //   step: 1,
        //
        //   range: [
        //     {
        //       label: 'Min',
        //       value: -3
        //     },
        //     {
        //       label: 'Mid',
        //       value: 0
        //     },
        //     {
        //       label: 'Max',
        //       value: 3
        //     }
        //   ]
        // },
        // {
        //   id: 5,
        //
        //   field: 'MATRIX',
        //   template: 'MATRIX_INPUT',
        //
        //   label: 'Matrix Response',
        //   description: 'The matrix allows for for even more advanced questions/responses.',
        //
        //   multiple: false,
        //   custom: false,
        //
        //   rows: [
        //     {
        //       label: 'First Item',
        //       value: 'first_item'
        //     },
        //     {
        //       label: 'Second Item',
        //       value: 'second_item'
        //     },
        //     {
        //       label: 'Third Item',
        //       value: 'third_item'
        //     }
        //   ],
        //
        //   cols: [
        //     {
        //       label: 'Bad',
        //       icon: 'mood_bad',
        //       value: -1
        //     },
        //     {
        //       label: 'Neutral',
        //       icon: 'sentiment_neutral',
        //       value: 0
        //     },
        //     {
        //       label: 'Good',
        //       icon: 'mood',
        //       value: 1
        //     }
        //   ]
        // }
      ]

    }
  ],

  thankYouNote: 'Thank you for submitting your survey.'

};

export const DUMMY_SURVEY_PANELS = {
  content: [{
    id: 1,
    name: 'B2B External Panel',
    panelType: { id: 2, displayName: 'External' },
    audienceType: { id: 1, displayName: 'B2B' },
    numberTargetResponses: 250,
    status: { id: 1, displayName: 'Active' },
    createdDate: 1490666386,
    endDate: 1490766386,
    industry: [{ id: 1, displayName: 'Industry 1' }, { id: 2, displayName: 'Industry 2' }]
  }, {
    id: 2,
    name: 'B2C External Panel',
    panelType: { id: 1, displayName: 'External' },
    audienceType: { id: 2, displayName: 'B2C' },
    numberTargetResponses: 500,
    status: { id: 1, displayName: 'Active' },
    createdDate: 1490666386,
    endDate: 1490766386
  }, {
    id: 3,
    name: 'Internal Panel 1',
    panelType: { id: 1, displayName: 'Internal' },
    audienceType: { id: 1, displayName: 'B2B' },
    numberTargetResponses: 100,
    status: { id: 1, displayName: 'Active' },
    createdDate: 1490666386,
    endDate: 1490766386,
    participants: {
      content: [{
        id: 1,
        firstName: 'Andrea',
        lastName: 'Smith',
        gender: 'Female',
        language: ['English', 'German'],
        ethnicity: 'White',
        income: 80000
      }, {
        id: 2,
        firstName: 'Andrew',
        lastName: 'Conru',
        gender: 'Male',
        language: ['Chinese', 'English', 'German'],
        ethnicity: 'White',
        income: 120000
      }, {
        id: 3,
        firstName: 'John',
        lastName: 'Doe',
        gender: 'Male',
        language: ['English'],
        ethnicity: 'White',
        income: 45000
      }, {
        id: 4,
        firstName: 'Jane',
        lastName: 'Doe',
        gender: 'Female',
        language: ['French'],
        ethnicity: 'White',
        income: 200000
      }]
    }
  }, {
    id: 4,
    name: 'Internal Panel 2',
    panelType: { id: 1, displayName: 'Internal' },
    audienceType: { id: 1, displayName: 'B2B' },
    numberTargetResponses: 1000,
    status: { id: 1, displayName: 'Active' },
    createdDate: 1490666386,
    endDate: 1490766386,
    participants: {
      content: [{
        id: 1,
        firstName: 'Andrea',
        lastName: 'Smith',
        gender: 'Female',
        language: ['English', 'German'],
        ethnicity: 'White',
        income: 80000
      }, {
        id: 2,
        firstName: 'Andrew',
        lastName: 'Conru',
        gender: 'Male',
        language: ['Chinese', 'English', 'German'],
        ethnicity: 'White',
        income: 120000
      }, {
        id: 3,
        firstName: 'John',
        lastName: 'Doe',
        gender: 'Male',
        language: ['English'],
        ethnicity: 'White',
        income: 45000
      }, {
        id: 4,
        firstName: 'Jane',
        lastName: 'Doe',
        gender: 'Female',
        language: ['French'],
        ethnicity: 'White',
        income: 200000
      }]
    }
  }]
};

export const DUMMY_SURVEY_RESPONSES = {
  content: [{
    id: 1,
    status: { id: 1, displayName: 'Completed' },
    firstName: 'John',
    lastName: 'Smith',
    age: 36,
    company: 'Acme, Inc.',
    quarantineReason: '',
    submitted: 1490666386,
    ip: '10.0.0.10',
    country: 'USA',
    avgResponseTime: 5.7,
    totalTime: 30
  }, {
    id: 2,
    status: { id: 1, displayName: 'Completed' },
    firstName: 'John',
    lastName: 'Smith',
    age: 36,
    company: 'Acme, Inc.'
  }, {
    id: 3,
    status: { id: 1, displayName: 'Completed' },
    firstName: 'John',
    lastName: 'Smith',
    age: 36,
    company: 'Acme, Inc.'
  }]
};

export const DUMMY_SURVEY_RESPONSE = {
  content: [{
    id: 1,
    status: { id: 1, displayName: 'Completed' },
    firstName: 'John',
    lastName: 'Smith',
    age: 36,
    company: 'Acme, Inc.'
  }]
};

export const DUMMY_SURVEY_ANALYSIS = {
  content: [{
    schema: 'schema/surveyAnalysis',
    id: 1,
    type: 'barChart',
    description: 'How satisfied were you with the current product experience?',
    summaryData: [{ label: 'Very Positive', count: 10, value: 1 },
      { label: 'Somewhat Positive', count: 10, value: 2 },
      { label: 'Normal', count: 20, value: 3 },
      { label: 'Somewhat Negative', count: 10, value: 4 },
      { label: 'Very Negative', count: 14, value: 5 }],
    responses: 54
  },
  {
    schema: 'schema/surveyAnalysis',
    id: 2,
    type: 'barChart',
    description: 'How satisfied were you with the current product experience?',
    summaryData: [{ label: 'Very Positive', count: 24, value: 1 },
        { label: 'Somewhat Positive', count: 1, value: 2 },
        { label: 'Normal', count: 10, value: 0 },
        { label: 'Somewhat Negative', count: 10, value: 4 },
        { label: 'Very Negative', count: 10, value: 5 }],
    responses: 45
  },
  {
    schema: 'schema/surveyAnalysis',
    id: 3,
    type: 'pieChart',
    description: 'How satisfied were you with the current product experience?',
    summaryData: [{ label: 'Very Positive', count: 5, value: 1 },
        { label: 'Somewhat Positive', count: 10, value: 2 },
        { label: 'Normal', count: 15, value: 3 },
        { label: 'Somewhat Negative', count: 10, value: 4 },
        { label: 'Very Negative', count: 5, value: 0.0 }],
    responses: 45
  },
  {
    schema: 'schema/surveyAnalysis',
    id: 4,
    type: 'pieChart',
    description: 'How satisfied were you with the current product experience?',
    summaryData: [{ label: 'Very Positive', count: 10, value: 1 },
        { label: 'Somewhat Positive', count: 10, value: 2 },
        { label: 'Normal', count: 10, value: 3 },
        { label: 'Somewhat Negative', count: 10, value: 4 },
        { label: 'Very Negative', count: 10, value: 5 }],
    responses: 45
  },
  {
    schema: 'schema/surveyAnalysis',
    id: 5,
    type: 'pieChart',
    description: 'How satisfied were you with the current product experience?',
    summaryData: [{ label: 'Very Positive', count: 10, value: 1 },
        { label: 'Somewhat Positive', count: 10, value: 2 },
        { label: 'Normal', count: 10, value: 3 },
        { label: 'Somewhat Negative', count: 10, value: 4 },
        { label: 'Very Negative', count: 10, value: 5 }],
    responses: 45
  },
  {
    schema: 'schema/surveyAnalysis',
    id: 6,
    type: 'pieChart',
    description: 'How satisfied were you with the current product experience?',
    summaryData: [{ label: 'Very Positive', count: 0, value: 1 },
        { label: 'Somewhat Positive', count: 15, value: 2 },
        { label: 'Normal', count: 10, value: 3 },
        { label: 'Somewhat Negative', count: 15, value: 4 },
        { label: 'Very Negative', count: 15, value: 5 }],
    responses: 45
  },
  {
    schema: 'schema/surveyAnalysis',
    id: 6,
    type: 'wordCloud',
    description: 'How satisfied were you with the current product experience?',
    summaryData: [{
      word: 'san francisco',
      score: 100
    }, {
      word: 'san mateo',
      score: 56
    }, {
      word: 'redwood city',
      score: 34
    }, {
      word: 'menlo park',
      score: 33
    }, {
      word: 'palo alto',
      score: 25
    }, {
      word: 'burlingame',
      score: 10
    }, {
      word: 'daly city',
      score: 5
    }, {
      word: 'foster city',
      score: 16
    }, {
      word: 'belmont',
      score: 5
    }, {
        word: 'millbrae',
        score: 10
      }, {
        word: 'atherton',
        score: 8
      }, {
        word: 'east palo alto',
        score: 11
      }, {
        word: 'south san francisco',
        score: 22
      }, {
        word: 'sunnyvale',
        score: 11
      }, {
        word: 'mountain view',
        score: 77
      }, {
        word: 'los altos',
        score: 11
      }, {
        word: 'pacifica',
        score: 11
      }, {
        word: 'san jose',
        score: 150
      }],
    responses: 45
  },
  {
    schema: 'schema/surveyAnalysis',
    id: 7,
    type: 'barChart',
    description: 'How satisfied were you with the current product experience?',
    summaryData: [{ label: 'Very Positive', count: 25, value: 1 },
        { label: 'Almost Positive', count: 10, value: 2 },
        { label: 'Sorta Positive', count: 15, value: 3 },
        { label: 'Kinda Positive', count: 2, value: 4 },
        { label: 'Normal', count: 3, value: 5 },
        { label: 'Kinda Negative', count: 5, value: 6 },
        { label: 'Sorta Negative', count: 8, value: 7 },
        { label: 'Very Negative', count: 9, value: 8 }],
    responses: 45
  },
  {
    schema: 'schema/surveyAnalysis',
    id: 8,
    type: 'barChart',
    description: 'How satisfied were you with the current product experience?',
    summaryData: [{ label: 'Very Positive', count: 15, value: 1 },
        { label: 'Somewhat Positive', count: 14, value: 1 },
        { label: 'Normal', count: 12, value: 1 },
        { label: 'Somewhat Negative', count: 9, value: 1 },
        { label: 'Very Negative', count: 5, value: 1 }],
    responses: 45
  },
  {
    schema: 'schema/surveyAnalysis',
    id: 9,
    type: 'pieChart',
    description: 'How satisfied were you with the current product experience?',
    summaryData: [{ label: 'Very Positive', count: 15, value: 1 },
        { label: 'Somewhat Positive', count: 14, value: 1 },
        { label: 'Normal', count: 12, value: 1 },
        { label: 'Somewhat Negative', count: 9, value: 1 },
        { label: 'Very Negative', count: 5, value: 1 }],
    responses: 45
  }]
};
