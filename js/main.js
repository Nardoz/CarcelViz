/*globals window, document, DatasetFilter, DatasetChart, _, jQuery, d3, ko*/

var DatavizCarceles;

;(function(global, document, $, d3, ko){

  'use strict';

  DatavizCarceles = global.DatavizCarceles = global.DatavizCarceles || {};

  DatavizCarceles.$slider = $('#slider');

  DatavizCarceles.sliderOptions = {
    min:0,
    max:100,
    step:1,
    orientation:'vertical',
    tooltip:'show',
    handle:'round',
    selection:'after',
    formater:function(v){
      return DatavizCarceles.convertSliderValue(v)+'%';
    }
  };

  DatavizCarceles.headers = [];

  DatavizCarceles.data = [];

  DatavizCarceles.map;

  DatavizCarceles.rankingLimit = 10;

  DatavizCarceles.$twitterButton = $('.twitter');

  DatavizCarceles.$facebookButton = $('.facebook');

  DatavizCarceles.$googleButton = $('.gplus');

  DatavizCarceles.$text = $('.texto-resumen');

  DatavizCarceles.$orderSelectors = $('.filter-order');

  DatavizCarceles.$consultarBtn = $('#consultar');

  DatavizCarceles.$desdeBtn = $('#fecha-desde');

  DatavizCarceles.$hastaBtn = $('#fecha-hasta');

  DatavizCarceles.$filter = $('#filter');

  DatavizCarceles.$fullScreenBtb = $('#full-screen-btn');

  DatavizCarceles.filter = new DatasetFilter();

  DatavizCarceles.bindings = {};

  var FilterOption = function(name, id, icon) {
    this.name = name;
    this.id = id;
    this.icon = icon;
  };

  DatavizCarceles.init = function () {
    //Init map
    DatavizCarceles.map = d3.datavizCarceles('map-container',$('#map-container').width(),DatavizCarceles.retrieveData);

    //Init button
    DatavizCarceles.$filter.on('change',DatavizCarceles.filterData);
    DatavizCarceles.$twitterButton.on('click',DatavizCarceles.shareTwitter);
    DatavizCarceles.$facebookButton.on('click',DatavizCarceles.shareFacebook);
    DatavizCarceles.$googleButton.on('click',DatavizCarceles.shareGoogle);
    DatavizCarceles.$fullScreenBtb.on('click',DatavizCarceles.fullScreen);

    var months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    $('#dateSelector').dateRangeSlider({
      bounds: {
        min: new Date(2009, 0, 1),
        max: new Date(2013, 12, 30)
      },
      defaultValues: {
        min: new Date(2009, 4, 1),
        max: new Date(2009, 7, 31)
      },
      arrows: true,
      step:{
        months: 12
      },
      formatter: function(val) {
        var month = val.getMonth() + 1;
        var year = val.getFullYear();

        return year;
      },
      scales: [{
        next: function(value) {
          var next = new Date(value);
          return new Date(next.setMonth(value.getMonth() + 12));
        },
        label: function(value) {
          return value.getFullYear();
        },
        format: function(tickContainer, tickStart, tickEnd) {
          tickContainer.addClass('month');
        }
      }]
    });

    $('#dateSelector').bind('valuesChanged', function(e, data) {
      var start = (data.values.min.getMonth() + 1) + '-' + data.values.min.getFullYear();
      var end   = (data.values.max.getMonth() + 1) + '-' + data.values.max.getFullYear();

      DatavizCarceles.$desdeBtn.val(start);
      DatavizCarceles.$hastaBtn.val(end);
      DatavizCarceles.filterData();
    });

    DatavizCarceles.$filter.selectpicker();

    global.y = 2009;
    $('#play').click(function() {

      if($(this).hasClass('playing')) {
        $(this).removeClass('playing').html('&#9658');
        global.clearInterval(global.interval);
      } else {
        $(this).addClass('playing').html('&#9689;');

        global.interval = global.setInterval(function() {

          $('#dateSelector').dateRangeSlider('values', new Date(global.y, 0, 1), new Date(global.y, 12, 27));

          if (global.y < 2013) {
            global.y++;
          } else {
            global.y = 2009;
          }

        }, 600);
      }

    });

  };

  DatavizCarceles.retrieveData = function(){

    $.getJSON('data/carceles.json', function(j){
      DatavizCarceles.data = j.rows;
      DatavizCarceles.filter.setDataset(j.rows);
      DatavizCarceles.filterData();
    });

  };

  DatavizCarceles.filterData = function(){
    var filter = DatavizCarceles.filter;
    var j = filter.filter(
      DatavizCarceles.$desdeBtn.val(),
      DatavizCarceles.$hastaBtn.val()
    );

    var filterField = DatavizCarceles.$filter.val(),
        limit = DatavizCarceles.rankingLimit;

    // agregamos el campo valor con el filterField especificado
    _.each(j, function(row) {
      row.valor = row[filterField];
    });

    $('#title').html($(':selected', DatavizCarceles.$filter.parent()).html().toLowerCase());

    DatavizCarceles.topRanking = filter.ranking(j, filterField, 'desc', limit);
    DatavizCarceles.botttomRanking = filter.ranking(j, filterField, 'asc', limit);

    DatavizCarceles.updateMap(j);

    DatasetChart.graph(DatavizCarceles.topRanking);
  };

  DatavizCarceles.fullScreen = function() {
    var el = document.documentElement,
        rfs =
          el.requestFullScreen ||
          el.webkitRequestFullScreen ||
          el.mozRequestFullScreen
    ;
    rfs.call(el);
  };

  DatavizCarceles.getLocation = function(href) {
    var l = document.createElement('a');
    l.href = href;
    return l;
  };

  DatavizCarceles.shareTwitter = function(e){
    e.preventDefault();

    var qObj = {
      'text': DatavizCarceles.$text.text(),
      'related': 'carceles',
      'hashtags': 'argentina,carceles'
    };

    var qs = $.param(qObj);

    var width  = 575,
      height = 400,
      left   = ($(window).width()  - width)  / 2,
      top    = ($(window).height() - height) / 2,
      url    = this.href + '?' + qs,
      opts   = 'status=1' +
           ',width='  + width  +
           ',height=' + height +
           ',top='    + top    +
           ',left='   + left;

    window.open(url, 'Twitter', opts);

    return false;
  };

  DatavizCarceles.shareFacebook = function(e){
    e.preventDefault();
    var qs =
      '&p[url]='+window.location+
      '&p[title]='+'Visualización de las cárceles argentinas...'+
      '&p[images][0]='+window.location+'img/share.png'+
      '&p[summary]='+DatavizCarceles.$text.text();

    var width  = 575,
      height = 400,
      left   = ($(window).width()  - width)  / 2,
      top    = ($(window).height() - height) / 2,
      url    = this.href+qs,
      opts   = 'status=1' +
           ',width='  + width  +
           ',height=' + height +
           ',top='    + top    +
           ',left='   + left;

    window.open(url, 'Facebook', opts);

    return false;
  };

  DatavizCarceles.shareGoogle = function(e){
    e.preventDefault();
    var qs = 'url=' + window.location;

    var width  = 575,
      height = 400,
      left   = ($(window).width()  - width)  / 2,
      top    = ($(window).height() - height) / 2,
      url    = this.href + '?' + qs,
      opts   = 'status=1' +
           ',width='  + width  +
           ',height=' + height +
           ',top='    + top    +
           ',left='   + left;

    window.open(url, 'Google+', opts);

    return false;
  };

  DatavizCarceles.updateMap = function(cities) {
    var $filter = DatavizCarceles.$filter;
    DatavizCarceles.map.update(
      cities, $filter.val(), $filter.find(':selected').text()
    );
  };

  DatavizCarceles.dotSeparateNumber = function(val){
    while (/(\d+)(\d{3})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+'.'+'$2');
    }
    return val;
  };

})(window, document, jQuery, d3, ko);

window.onload = function() {
  DatavizCarceles.init();
};
