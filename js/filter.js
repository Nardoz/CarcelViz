/*globals _*/

var DatasetFilter = function() {

  var dataset = {};

  this.setDataset = function(d) {
    dataset = d;
  }

  this.filter = function(dateFrom, dateTo) {

    var data = [];

    if(dateFrom.split('-').length != 2) {
      console.error('Invalid start date: ' + dateFrom);
      return data;
    }

    if(dateTo.split('-').length != 2) {
      console.error('Invalid end date: ' + dateTo);
      return data;
    }

    var monthFrom = parseInt(dateFrom.split('-')[0]);
    var yearFrom  = parseInt(dateFrom.split('-')[1]);

    var monthTo = parseInt(dateTo.split('-')[0]);
    var yearTo  = parseInt(dateTo.split('-')[1]);

    var filtered = _.filter(dataset, function(item) {
      return (
        (parseInt(item.anio) >= yearFrom  && parseInt(item.mes) >= monthFrom) &&
        (parseInt(item.anio) <= yearTo    && parseInt(item.mes) <= monthTo)
      );
    });

    var groupedByCity = _.groupBy(filtered, function(item) {
      return item.ciudad;
    });

    _.each(groupedByCity, function(city) {

      var reduced = _.reduce(city, function(memo, item) {

        var memo2 = _.clone(memo);

        memo2.poblacion         = memo2.poblacion + item.poblacion;
        memo2.fallecimientos    = memo2.fallecimientos + item.fallecimientos;
        memo2.mt                = memo2.mt + item.mt;
        memo2.sanciones         = memo2.sanciones + item.sanciones;
        memo2.lat               = item.lat;
        memo2.lon               = item.lon;
        memo2.anio              = item.anio;
        memo2.mes               = item.mes;
        memo2.provincia         = item.provincia;
        memo2.ciudad            = item.ciudad;
        memo2.establecimiento   = item.establecimiento;
        

        return memo2;
      },{
        poblacion: 0,
        fallecimientos: 0,
        mt: 0,
        sanciones: 0,
        lat: 0,
        lon: 0,
        anio: 0,
        mes: 0,
        provincia: '',
        ciudad: '',
        establecimiento: ''
      });

      /*
        totals is an object with the totals of several values
        calculateAverage transforms these totals in averages
        counting the non-empty items
       */
      var calculateAverage = function(data, totals, fields) {

        totals = _.clone(totals);

        if (_.isString(fields)) fields = fields.split(',');
        if (! _.isArray(fields)) fields = [fields];

        _.each(fields, function(field) {
          var count = _.filter(data, function(row) {
            return row[field] !== undefined;
          }).length;

          totals[field] = parseFloat((totals[field] / count).toFixed(2));
        });

        return totals;
      };

      reduced = calculateAverage(city, reduced, '');

      data.push(reduced);
    });

    return data;

  };

  this.ranking = function(data, field, sortOrder, limit) {

    sortOrder = (sortOrder || 'desc').toLowerCase();
    limit = limit || 5;

    var sorted = _.sortBy(data, function(row) {
      return row[field];
    });

    sorted = _.filter(sorted, function(item) {console.log(item[field])
      return item[field] > 0;
    })

    if (sortOrder === 'desc') sorted = sorted.reverse();

    sorted = sorted.slice(0, limit);

    return sorted;
  };

};
