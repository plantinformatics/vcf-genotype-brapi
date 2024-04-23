const maps_response = {
      result: {data: []},
      "@context": null,
      "@context": [
        "https://brapi.org/jsonld/context/metadata.jsonld"
      ],
      "metadata": {
        datafiles: [],
        status: [],  // or [{}]
        pagination: {pageSize: 1000, totalCount: 2, totalPages: 1, currentPage: 0},
        /* or possibly :
        pagination: {
          pageSize: 2147483647,
          page: 0,
          totalCount: 1,
          totalPages: 1
        } */
      },
};


//------------------------------------------------------------------------------

export { maps }
function maps(req, res) {
  console.log('Received query:', req.query);

  /** result is in the form : {result : {data : [{mapDbId}]}} ? */
  const responseData = maps_response;

  res.json(responseData);
};

//------------------------------------------------------------------------------

