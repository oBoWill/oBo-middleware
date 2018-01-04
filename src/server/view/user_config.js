
export default {

  tenant: {
    id: 'agilepm',
    name: 'AgilePM'
  },

  statuses: {

    id: 'statuses',
    src: 'tenants/agilepm/statuses',

    label: {
      singular: 'Status',
      plural: 'Statuses'
    },

    type: 'record',

    fields: {
      title: [
        {
          label: 'Title',
          name: 'title',
          type: 'text'
        }
      ],
      description: [
        {
          label: 'Description',
          name: 'description',
          type: 'textarea'
        }
      ]
    }

  },

  tags: {

    id: 'tags',
    src: 'tenants/agilepm/tags',

    label: {
      singular: 'Tag',
      plural: 'Tags'
    },

    type: 'record',

    fields: {
      title: [
        {
          label: 'Name',
          name: 'name',
          type: 'header'
        }
      ],
      description: [
        {
          label: 'Description',
          name: 'description',
          type: 'textarea'
        }
      ]
    }

  },

  products: {

    id: 'products',
    // Source of data.
    src: 'tenants/agilepm/products',

    label: {
      singular: 'Product',
      plural: 'Products'
    },

    // Determines the component used to render.
    type: 'record',

    // Determines input field order, type, and source.
    fields: {

      title: [
        {
          label: 'Name',
          name: 'name',
          type: 'header'
        }
      ],
      description: [
        {
          label: 'Description',
          name: 'description',
          type: 'textarea'
        }
      ]

    }

  },

  features: {

    id: 'features',
    // Source of data, api endpoint.
    src: 'tenants/agilepm/features',

    label: {
      singular: 'Feature',
      plural: 'Features'
    },

    // Determines the component used to render.
    type: 'record',

    // Determines input field order, type, and source.
    fields: {


      title: [
        {
          label: 'Name',
          name: 'name',
          type: 'header'
        }
      ],

      description: [
        {
          label: 'Description',
          name: 'description',
          type: 'textarea'
        }
      ],

    }

  },

  ideas: {

    id: 'ideas',
    // Source of data.
    src: 'tenants/agilepm/ideas',

    label: {
      singular: 'Idea',
      plural: 'Ideas'
    },

    // Determines the component used to render.
    type: 'record',

    // Determines input field order, type, and source.
    fields: {

      // Main fields (shown at creation) and top of idea's page.
      title: [
        {
          label: 'Name',
          name: 'name',
          type: 'header'
        }
      ],

      description: [
        {
          label: 'Description',
          name: 'description',
          type: 'textarea'
        },{
          label: 'Problem to solve',
          name: 'problem',
          type: 'textarea'
        }
      ],

      // Fields shown in 'details' pane.
      details: [
        {
          label: 'Product',
          name: 'products',
          type: 'select',
          src: 'tenants/agilepm/products',
          srcId: 'products'
        },{
          label: 'Status',
          name: 'status',
          srcId: 'statuses',
          type: 'select'
        },{
          label: 'Associated Feature(s)',
          name: 'features',
          type: 'select',
          src: 'tenants/agilepm/features',
          srcId: 'features',
          multiple: false
        },{
          label: 'Associated Idea(s)',
          name: 'ideas',
          type: 'select',
          src: 'tenants/agilepm/ideas',
          srcId: 'ideas',
          multiple: false
        }
      ],

      // Associated domain level object(s).
      // associated: [
      //
      // ],

      // Shown in the side-panel (if any).
      meta: [
        {
          label: 'Value',
          name: 'value',
          type: 'score'
        },{
          label: 'Effort',
          name: 'effort',
          type: 'score'
        },{
          label: 'Score',
          name: 'score',
          type: 'score'
        },{
          label: 'Tags',
          name: 'tags',
          type: 'tag',
          multiple: false
        },{
          label: 'Related Links',
          name: 'links',
          type: 'link',
          multiple: false
        }
      ]

    }

  }

}


