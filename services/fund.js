const db = require('../database');

// Function to get fund valuation
const getFundValuation = (fundId) => {
    return db.query('SELECT * FROM fund_valuations WHERE fund_id = ?', [fundId]);
};

// Function to get batch fund valuations
const getBatchFundValuation = (fundIds) => {
    return db.query('SELECT * FROM fund_valuations WHERE fund_id IN (?)', [fundIds]);
};

// Function to search fund
const searchFund = (searchCriteria) => {
    let query;
    let params;
    if (typeof searchCriteria === 'object') {
        // Handle object format
        const { CODE, NAME, TYPE, PINYIN } = searchCriteria;
        const conditions = [];
        if (CODE) conditions.push('code = ?');
        if (NAME) conditions.push('name = ?');
        if (TYPE) conditions.push('type = ?');
        if (PINYIN) conditions.push('pinyin = ?');
        query = 'SELECT * FROM funds WHERE ' + conditions.join(' AND ');
        params = [CODE, NAME, TYPE, PINYIN].filter(Boolean);
    } else if (typeof searchCriteria === 'string') {
        // Handle string format
        const codes = searchCriteria.split(',').map(s => s.trim());
        query = 'SELECT * FROM funds WHERE code IN (?)';
        params = [codes];
    } else {
        throw new Error('Invalid search criteria format');
    }
    return db.query(query, params);
};

// Function to get fund history
const getFundHistory = (fundId) => {
    return db.query('SELECT * FROM fund_history WHERE fund_id = ?', [fundId]);
};

// Function to get fund rank
const getFundRank = () => {
    return db.query('SELECT * FROM fund_rank ORDER BY rank ASC');
};

// Function to get fund detail
const getFundDetail = (fundId) => {
    return db.query('SELECT * FROM funds WHERE id = ?', [fundId]);
};

// Function to calculate profit
const calculateProfit = (investment, valuation) => {
    return valuation - investment;
};

module.exports = {
    getFundValuation,
    getBatchFundValuation,
    searchFund,
    getFundHistory,
    getFundRank,
    getFundDetail,
    calculateProfit
};