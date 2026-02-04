  onFundTap: function (e) {
    // Check if fund exists in e.detail
    let fund = e.detail ? e.detail.fund : e.currentTarget.dataset.fund;

    // Add null check before accessing fund.code
    if (fund && fund.code) {
        // your existing logic
    } else {
        console.error('Fund data is undefined or fund.code is missing.');
    }
  }