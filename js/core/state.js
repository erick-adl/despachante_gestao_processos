export const state = {
    DATA: {
        clientes: [],
        agenda: []
    },

    VIEW: {
        name: 'home',
        params: {}
    },

    BOOTED: false,

    SEARCH_QUERY: "",

    HOME_PERIOD: 'dia',

    REPORT_RANGE: null,

    REPORT_PERIOD: 'dia',

    CURRENT_CLIENT_ANEXOS: [],

    REMOVED_CLIENT_ANEXO_KEYS: [],

    CURRENT_INFRACOES: [],
    CURRENT_TIPOS: [],
    CURRENT_COBRANCAS: [],
    CURRENT_ANEXOS: [],
    REMOVED_ANEXO_KEYS: [],
    SAVING_SERVICE: false,
    SAVING_CLIENT: false,
};
