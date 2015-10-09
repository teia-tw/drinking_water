(function ($, L) {
  function screenSize () {
    return $(window).width() > 400 ? 'large' : 'small'
  }

  var map = new L.Map('map')
  var modal = (function (s) {
    var settings = s || {}
    var component = {}
    var $overlay = $('<div class="modal overlay"></div>')
    var $modal = $('<div class="modal container"></div>')
    var $content = $('<div class="modal content"></div>')
    var $close = $('<a class="modal close" href="#">close</a>')

    $modal.hide()
    $overlay.hide()
    $modal.append($close, $content)

    component.mount = function () {
      $('body').append($overlay, $modal)
    }

    component.center = function () {
      var top, left
      top = Math.max($(window).height() - $modal.outerHeight(), 0) / 2
      left = Math.max($(window).width() - $modal.outerWidth(), 0) / 2
      $modal.css({
        top: top + $(window).scrollTop(),
        left: left + $(window).scrollLeft()
      })
    }

    component.open = function (content) {
      $('.leaflet-control').css('display', 'none')
      $modal.css({
        width: settings.width || 'auto',
        height: settings.height || 'auto'
      })
      console.log(content)
      $content.append(content)
      component.center()
      $(window).bind('resize.modal', component.center)
      $modal.show()
      $overlay.show()
    }

    component.close = function () {
      $('.leaflet-control').css('display', 'inherit')
      $modal.hide()
      $overlay.hide()
      $(window).unbind('resize.modal')
      $content.children().remove()
    }

    $overlay.click(function (e) {
      e.preventDefault()
      component.close()
    })

    $close.click(function (e) {
      e.preventDefault()
      component.close()
    })

    return component
  })({
    width: screenSize() === 'large' ? $(window).width() / 1.5 : $(window).width() / 1.1
  })

  var addStation = (function (map, modal) {
    var component = {}
    var $dialog = $('<div class="add-station dialog"></div>')
    var $overlay = $('<div class="add-station dialog overlay"></div>')
    var $add = $('<input type="radio" name="fillData"/>')
    var $submit = $('<input type="radio" name="submit"/>')
    var $cancel = $('<input type="radio" name="cancel"/>')
    var $anchor = $('<i class="add-station anchor"></i>')
    var opened = false
    var point

    component.mount = function () {
      $('body').append($overlay, $dialog)
    }
    component.open = function (opt) {
      point = opt.containerPoint
      if (opened) return
      component.close()
      $add.click(function (e) {
        e.preventDefault()
        component.fillData()
      })
      $cancel.click(function (e) {
        e.preventDefault()
        component.close()
      })

      $dialog.append(
        $anchor,
        $('<div class="add-station content">加一個飲水地點？</div>')
        .append(
          '<br>',
          $('<label>是</label>').prepend($add),
          $('<label>否</label>').prepend($cancel)
          )
      )
      component.pointTo(point.x, point.y)
      $dialog.show()
      opened = true
    }
    component.close = function () {
      $dialog.children().remove()
      $dialog.removeClass('tl tr bl br')
      $dialog.hide()
      opened = false
    }
    component.pointTo = function (x, y) {
      var leftRightThreshhold = Math.floor($(window).width() / 2)
      var topBottomThreshold = Math.max($dialog.outerHeight() + 50, ($(window).height() / 3))
      var direction = (y < topBottomThreshold ? 'b' : 't') + (x < leftRightThreshhold ? 'r' : 'l')
      $dialog.addClass(direction)
      $dialog.css({
        top: (direction[0] === 'b' ? y : y - $dialog.outerHeight()),
        left: (direction[1] === 'r' ? x : x - $dialog.outerWidth())
      })
    }
    component.fillData = function () {
      component.close()
      $submit.click(function (e) {
        e.preventDefault()
        component.submit()
      })
      $cancel.click(function (e) {
        e.preventDefault()
        modal.close()
      })
      var $content = $('<div>（填寫飲水點資料）</div>')
      $content.append($submit, $cancel)
      modal.open($content)
    }
    component.submit = function () {
      modal.close()
    }
    return component
  })(map, modal)

  function userLocator (map, s) {
    var settings = s || {
      setView: true,
      maxZoom: 17,
      tap: true
    }
    var component = {}
    var button
    var circle

    function onLocationFound (e) {
      if (circle === undefined) {
        circle = L.circle(e.latlng, 200).addTo(map)
      } else {
        circle.setLatLng(e.latlng).setRadius(200)
      }
    }

    function onLocationError (e) {
      console.log(e)
    }

    map.on('locationfound', onLocationFound)
    map.on('locationerror', onLocationError)
    map.on('stopfollowing', function (e) {
      if (circle !== undefined) {
        circle.setRadius(0)
      }
    })
    map.on('contextmenu', function (evt) {
      addStation.open(evt)
    })

    component.button = function () {
      if (arguments.length === 1) {
        button = arguments[0]
        return component
      }
      if (button === undefined) {
        button = L.control.locate({
          icon: 'fa fa-map-marker',
          iconLoading: 'fa fa-spinner fa-spin',
          drawCircle: false,
          follow: true,
          onLocationError: onLocationError,
          locateOptions: settings
        })
      }
      return button
    }

    component.start = function () {
      component.button().start()
    }

    component.stop = function () {
      component.button().stop()
    }

    component.mapButton = function () {
      return function () {
        var map = this
        component.button().addTo(map)
      }
    }

    return component
  }
  var locator = userLocator(map)

  var about = (function (locator, modal) {
    var component = {}
    var $content = $('<div><p>一個600ml的瓶裝水，需要耗費600ml的6~7倍水量製造它的塑膠瓶！在缺水的時代來臨時，別再讓塑膠瓶跟我們搶水資源了！</p>' +
      '<p>自備環保杯是個絕佳的選擇，但是喝完自備的水後怎麼辦？</p>' +
      '<p>從現在開始，我們要讓帶環保杯的朋友，可以快速的找到補水地點，讓大家隨心所欲的喝水保健康。</p>' +
      '<p>此外，<a href="http://www.e-info.org.tw/" target="_blank">台灣環境資訊協會</a>懇請大家，少喝瓶裝水，努力減少塑膠瓶及瓶蓋等海洋垃圾，減少海鳥、海龜、鯨豚…等海洋生物吞食這些塑膠垃圾而痛苦至死。您的努力，也將是他們活命的機會！</p>' +
      '<p><a href="http://beta.hackfoldr.org/drinking-water/" target="_blank">計劃網站</a></p>' +
      '<p><a href="https://docs.google.com/document/d/1by9-SqfJ6qvu0dGER4E63bKsvGp3LhoqK86XFHHM_JI/edit?usp=sharing" target="_blank">一起編輯飲水地圖</a></p>' +
      '<p><a href="https://e-info.neticrm.tw/civicrm/contribute/transact?reset=1&id=9" target="_blank">捐款給台灣環境資訊協會</a></p></div>')
    var $showNextTime = $('<label id="showNextTime"><input type="checkbox"></input>下次顯示這個訊息</label>')
    var $locator = $('<a id="locator" href="#">顯示我的位置</a>')

    component.open = function () {
      $content.append($locator, $showNextTime)
      $showNextTime.children()[0].checked = component.showNextTime()
      $showNextTime.click(function (e) {
        window.localStorage.showNextTime = $(this).children()[0].checked
      })
      $locator.click(function (e) {
        e.preventDefault()
        locator.start()
        component.close()
      })
      modal.open($content)
    }
    component.close = modal.close

    component.mapButton = function (settings) {
      return function () {
        var map = this
        function onClick (e) {
          component.open()
        }
        L.easyButton('fa fa-question-circle', onClick, '關於飲水地圖', map)
      }
    }

    component.showNextTime = function () {
      return window.localStorage.showNextTime === undefined || window.localStorage.showNextTime === 'true'
    }

    return component
  })(locator, modal)

  function osmLayer () {
    var attr_osm = '地圖資料 &copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
    return new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      opacity: 0.7,
      maxZoom: 18,
      attribution: attr_osm
    })
  }

  function waterDropIcon () {
    return L.icon({
      iconUrl: 'waterdrop.png',
      iconSize: [29, 40],
      iconAnchor: [15, 40],
      popupAnchor: [1, -20]
    })
  }

  function drinkingWaterLayer () {
    return function () {
      var map = this
      var l = new L.OverPassLayer({
        query: 'area(3600449220)->.searchArea;(node["amenity"="drinking_water"](area.searchArea);node["drinking_water"="yes"](area.searchArea);way["amenity"="drinking_water"](area.searchArea);way["drinking_water"="yes"](area.searchArea);rel["amenity"="drinking_water"](area.searchArea);rel["drinking_water"="yes"](area.searchArea););out;',
        callback: function (data) {
          for (var i = 0; i < data.elements.length; i++) {
            var e = data.elements[i]
            if (e.id in this.instance._ids) return
            e.tags.name = e.tags.name || '飲水機'
            e.tags.level = e.tags.level ? (+e.tags.level < 0 ? '地下 ' + -e.tags.level : e.tags.level) + ' 樓' : undefined
            this.instance._ids[e.id] = true
            var pos = new L.LatLng(e.lat, e.lon)
            var popup = '<div>' +
              '<div class="name">' + e.tags.name + '</div>' +
              '<div class="water">' +
              (e.tags['drinking_water:iced_water'] ? '<img src="iced.png"/>' : '') +
              (e.tags['drinking_water:cold_water'] ? '<img src="cold.png"/>' : '') +
              (e.tags['drinking_water:warm_water'] ? '<img src="warm.png"/>' : '') +
              (e.tags['drinking_water:hot_water'] ? '<img src="hot.png"/>' : '') +
              (e.tags.iced_water ? '<img src="iced.png"/>' : '') +
              (e.tags.cold_water ? '<img src="cold.png"/>' : '') +
              (e.tags.warm_water ? '<img src="warm.png"/>' : '') +
              (e.tags.hot_water ? '<img src="hot.png"/>' : '') +
              '</div>' +
              (e.tags.description ? '<div class="description">' + e.tags.description + '</div>' : '') +
              (e.tags.level ? '<div class="level">' + e.tags.level + '</div>' : '') +
              '</div>'
            var marker = L.marker(pos, {
              icon: waterDropIcon(),
              fillColor: '#fa3',
              fillOpacity: 0.5
            })
              .bindPopup(popup)
            this.instance.addLayer(marker)
          }
        },
        minZoomIndicatorOptions: {
          position: 'topright',
          minZoomMessageNoLayer: '',
          minZoomMessage: ''
        }
      })
      map.addLayer(l)
    }
  }

  map
    .addLayer(osmLayer())
    .on('load', drinkingWaterLayer())
    .on('load', locator.mapButton())
    .on('load', about.mapButton())
    .on('load', (function () {
      return function () {
        L.control.graphicScale({
          fill: 'hollow',
          imperial: false,
          updateWhenIdle: true
        }).addTo(this)
      }
    })())
    .on('load', function () {
      if (about.showNextTime()) {
        about.open()
      }
      if (!about.showNextTime()) {
        locator.start()
      }
    })

  function appStart () {
    modal.mount()
    addStation.mount()
    map
      .setView(new L.LatLng(25.0003133, 121.5388148), 15)
  }
  $(document).ready(appStart)
})($, L)
