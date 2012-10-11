
// TODO: rewrite the code to use the module pattern I learned about
// instead of having a global variable
var markersOnMap = [];


/**
 * Draws a Google Map centered on Providence, RI
 *
 * @return {google.maps.Map} A reference to the google.maps.Map object.
 */
function createMap() 
{
  var myOptions = {
    center: new google.maps.LatLng(41.6705, -71.57555),
    zoom: 10,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  return new google.maps.Map(document.getElementById('map_canvas'), myOptions);
}

/**
 * Request an XML file from server.
 *
 * @param {string} url - Relative path to the desired XML file.
 * @return {XMLDocument} - The XMLDocument object representing the desired file.
 */
function loadXMLfile(url)
{
  var xmlhttp, xmldoc;

  if (window.XMLHttpRequest)
  {
    // code for IE7+, Firefox, Chrome, Opera, Safari
    //alert("using XMLHttpRequest");
    xmlhttp = new XMLHttpRequest();
  }
  else
  {
    // code for IE6, IE5
    //alert("using ActivXObject");
    xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
  }

  xmlhttp.open('GET', url, false);

  xmlhttp.send();


  if (xmlhttp.status != '200')
  {
    /* alert("Sorry, unablable to load your search results, " +
        "because of an unsuccessful connection attempt to PLOVER.\n" +
        "Please, try your search again. \n" +
        " If it still doesn't work, " +
        " contact Kien Harris of MIS at kien.harris@dem.ri.gov"); */
    // Warning: when this happens, you get sent to the pacific ocean.
    alert('Error! Result of xml request is: ' + xmlhttp.statusText);
  }

  xmldoc = xmlhttp.responseXML;

  if (!xmldoc) { alert('XMLHTTP response document is null'); }

  return xmldoc;
}

/*
 * Constructor for Facility objects
 *
 * @param{string} id - The ploverid for the facility.
 * @param{string} name - The name for the facility.
 * @param{string} address - Both the street number and street name for the address.
 * @param{string} city - The city for the facility.
 * @param{string} lat - The latitude for the facilitiy.
 * @param{string} lng - The longitude for the facility.
 * @param{string} proglist - For now, this parameter is unused, so it'll be an empty string.
 * @return{Facility} - An object that encapsulates all the properties of a facility.
 */
function Facility(id, name, address, city, lat, lng, proglist) 
{
  this.id = id;
  this.name = name;
  this.address = address;
  this.city = city;
  this.lat = lat;
  this.lng = lng;
  this.proglist = proglist;
  this.toString = function() {
    var stringFormat = '';

    stringFormat += 'ploverid: ' + this.id + '\n';
    stringFormat += 'name: ' + this.name + '\n';
    stringFormat += 'address: ' + this.address + '\n';
    stringFormat += 'city: ' + this.city + '\n';
    stringFormat += 'lat: ' + this.lat + '\n';
    stringFormat += 'lng: ' + this.lng + '\n';
    stringFormat += 'proglist: ' + this.proglist + '\n';

    return stringFormat;
  };
}

/**
 * Returns a facility object that corresponds to the given facility element
 *
 * @param {Element} facElement - A facility element created from PLOVER.
 * @return {Facility} - A facility object.
 */
function facilityFactory(facElement) 
{
  var id = facElement.getAttribute('ploverid');
  var name = facElement.getAttribute('facilityname');
  var address = facElement.getAttribute('address');
  var city = facElement.getAttribute('city');
  var lat = facElement.getAttribute('lat');
  var lng = facElement.getAttribute('long');
  var proglist = facElement.getAttribute('proglist'); //A facility can have more than one program.

  var facility = new Facility(id, name, address, city, lat, lng, proglist);

  return facility;
}

/**
 * Returns the filename of the search results.
 *
 * TODO: The returned value may be null or undefined. Is there another way?
 * @return {string,null} - The filename of the xml file containing the search results.
 */
function getSearchResultsFilename()
{
  return document.getElementById('hdnSearchResultsFilename').getAttribute('value').trim();
}

/**
 * Sets the appropriate hidden fields in order to pass the
 * values to the server.
 *
 * @param {string} latitude - The latitude to be stored in hidden field for retrieval by server.
 * @param {string} longitude - The longitude to be stored in hidden field for retrieval by server.
 */
function setCenterCoord(latitude, longitude)
{
  document.getElementById('hdnLat').value = latitude;
  document.getElementById('hdnLng').value = longitude;
  /*alert("hdnlat/lng set to: " + document.getElementById("hdnLat").value + ", " + document.getElementById("hdnLng").value);*/
}

/**
 * Connects the search textfield to Google's autocomlete feature.
 *
 * @param {googl.maps.Map} map - The only map object of the page.
 */
function setupAutocomplete(map) 
{
  var input = document.getElementById('txtSearchLocation');

  // Rough estimation of RI's boundaries.
  var southWestCorner = new google.maps.LatLng(41.300, -71.871);
  var northEastCorner = new google.maps.LatLng(42.036, -71.143);

  var autocompleteOptions = {
    bounds: new google.maps.LatLngBounds(southWestCorner, northEastCorner),
    componentRestrictions: { country: 'us' }
  };

  var autocomplete = new google.maps.places.Autocomplete(input, autocompleteOptions);

  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    //alert("autocomplete fired the place_changed event");
    var place = autocomplete.getPlace();
    //alert("called getPlace() from autocomplete");
    if (!place.geometry.location)
    {
      alert('geometry.location is null or undefined');
    }
    var coord = place.geometry.location;
    //alert("read the location propertry from the geometry object");
    setCenterCoord(coord.lat(), coord.lng());
  });
}

/**
 * Returns the string to be used in the marker's infowindow
 *
 * @param {Facility} facility - The object representation of a facility.
 * @return {string} - The string of HTML to be placed inside the infowindow.
 */
function createInfoWindowContent(facility)
{
  var imgString = '';
  imgString += "<img border='0' src='http://maps.googleapis.com/maps/api/streetview?size=90x68&location=";
  imgString += facility.lat + ',' + facility.lng + "&sensor=false'>";

  var facinfoURL = "<a href='facinfo.aspx?ploverid=" + facility.id + "' target='_blank'>View PLOVER Facility Info</a>";

  var contentString = '';
  contentString += '<table border=\"0\" style=\"width=300px;font-family:verdana;\"> ';
  contentString += '<tr >';
  contentString += '<td colspan=\"2\" >';
  contentString += '<span style=\"color:#333399;font-size:80%;font-weight:bold\"> ' + facility.name + '</span>';
  contentString += '</td>';
  contentString += '</tr>';
  contentString += ' <tr>';
  contentString += '<td STYLE=\"width:60%;font-size:70%; color:\">';
  contentString += '</br>' + facility.address + '</br>' + facility.city + ' </br> ' + facinfoURL + ' </td> ';
  contentString += '<td style=\"width:40%\">' + imgString + ' </td> ';
  contentString += '</tr>';
  contentString += '<tr>';
  contentString += '<td colspan=\"2\" style=\"font-size:70%\">';
  contentString += '</br> PLOVER Programs: ' + facility.proglist;
  contentString += '</td>';
  contentString += '</tr>';
  contentString += '</table>';

  return contentString;
}

function setupClickListener(map, marker, infowindow, facility)
{
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.close();
    infowindow.setContent(createInfoWindowContent(facility));
    infowindow.open(map, marker);
  });
}


// Toggle the display property from "block" to "none", or vice versa.
// Also, toggle the warning-box description from "click to view" to
// "click to hide", or vice versa.
function togglePlaceables()
{
  var list = document.getElementById('list-of-unplaceables');
  var link = document.getElementById('unplaceables').getElementsByTagName('a')[0];

  /* Note: list.style.display will return an empty string no
   * matter what the style sheet says.
   *
   * This doesn't mean that the display property is blank, but
   * that it is set to style sheet's value.
   *
   * The only time list.style.display will return something other
   * than blank is when I've programmatically set it.
   *
   * see: stackoverflow.com/questions/7420109/what-does-style-display-actually-do
   */

  if (list.style.display === 'block')
  {
    list.style.display = 'none';
    link.innerHTML = link.innerHTML.replace('hide', 'view');
  }
  else
  {
    list.style.display = 'block';
    link.innerHTML = link.innerHTML.replace('view', 'hide');
  }
}

function processSearchResults(map) 
{
  // check the hidden field value attribute.
  var searchResultsFilename = document.getElementById('hdnSearchResultsFilename').getAttribute('value');
  //alert('hdnsearchresultsfilename has the value: ' + searchResultsFilename);


  // If it exists, then request the file from the server and populate the map.
  if (searchResultsFilename)
  {

    // request xml file
    var xmldoc = loadXMLfile('/xmloutput/temp/' + searchResultsFilename);

    // Array of all the facility tags.
    var allFacilities = xmldoc.getElementsByTagName('Facility');

    // Separate allFacilities into two categories, those that have coordinates
    // and those that don't.
    placeable = [];
    var unplaceable = [];
    for (var i = 0; i < allFacilities.length; i++)
    {
     var facility = facilityFactory(allFacilities[i]);

     // For a facility to be placeable, it has to have a coordinates
     if (facility.lat && facility.lng)
     {
       placeable.push(facility);
     }
     else
     {
       unplaceable.push(facility);
     }
    }

    // Unplaceable facilites will be put into a list.
    if (unplaceable.length != 0)
    {
      // Show the user the number of unplaceable facilities, as well as
      // toggle on/off the list of unplaceables.

      // Create the link.
      var link = document.createElement('a');
      link.setAttribute('href', 'javascript:void(0);');
      link.onclick = togglePlaceables;
      link.innerHTML = 'There are ' + unplaceable.length + ' facilities that could not be mapped! (click to view)';

      // Place link into the message box.
      document.getElementById('unplaceables').appendChild(link);

      // Make the message box visible.
      document.getElementById('unplaceables').style.display = 'block';

      // Create a list for unplaceable facilities.
      var list = document.createElement('ul');
      list.setAttribute('id', 'list-of-unplaceables');

      // Populate the list with unplaceable facilities.
      for (var i = 0; i < unplaceable.length; i++)
      {
        var listItem = document.createElement('li');

        var info = '';
        info += '<p>PLOVER ID: ' + unplaceable[i].id + '</p>';
        info += '<p>Facility Name: ' + unplaceable[i].name + '</p>';
        info += '<p>Address: ' + unplaceable[i].address + '</p>';
        info += '<p>City: ' + unplaceable[i].city;
        info += '<p>Coordinates: ' + (unplaceable[i].lat ? unplaceable[i].lat : ' ') + (unplaceable[i].lng ? ', ' + unplaceable[i].lng : ' ') + '</p>';

        listItem.innerHTML = info;

        list.appendChild(listItem);
      }

      document.getElementById('unplaceables').appendChild(list);
    }


    if (placeable.length > 0)
    {

      // Put markers on the map, and then adjust the viewport
      var bounds = new google.maps.LatLngBounds();

      // Create a blank info window
      infowindow = new google.maps.InfoWindow({ content: '' });

      //alert("about to place the markers on the map");
      for (var i = 0; i < placeable.length; i++) {
        var facility = placeable[i];
        //alert("about to add this facility to the map: " + facility);
        var latlng = new google.maps.LatLng(facility.lat, facility.lng);
        bounds.extend(latlng);
        var marker = new google.maps.Marker({
          position: latlng,
          map: map,
          title: facility.name
        });

        // Added this to make clearing the map of markers possible.
        markersOnMap.push(marker);

        setupClickListener(map, marker, infowindow, facility);
      }

      map.fitBounds(bounds);
    }
    else
    {
      // This could occure when no facilities are within the radius.
      map.panTo(new google.maps.LatLng(document.getElementById('hdnLat').value, document.getElementById('hdnLng').value));
      alert("Your search didn't return any results.");
    }
  }
}

// Switch visibility between the General Search and the Advanced Search.
function toggleAdvancedSearch() 
{
  var generalSearchForm = document.getElementById('simpleSearch');
  var advancedSearchForm = document.getElementById('advancedSearch');

  var link = document.getElementById('showAdvancedParameters');

  // Is the Advanced Search form visible?
  if (advancedSearchForm.style.display === 'none' || advancedSearchForm.style.display === '')
  {
    // No, then make the Advanced Search visible.
    advancedSearchForm.style.display = 'block';

    // Save the new state.
    document.getElementById('hdnIsAdvancedSearchVisible').value = 'yes';

    // Make the General Search invisible.
    generalSearchForm.style.display = 'none';

    // Update the text in the link.
    link.innerHTML = 'General Search';
  }
  else
  {
    // Yes, the Advanced Search is visible. Okay then,
    // hide it.
    advancedSearchForm.style.display = 'none';

    // Save the new state.
    document.getElementById('hdnIsAdvancedSearchVisible').value = 'no';

    // Make the General Search Visible.
    generalSearchForm.style.display = 'block';

    // Update the text in the link.
    link.innerHTML = 'Advanced Search';
  }
}

function setCheckboxListener() 
{
  var fieldset = document.getElementsByTagName('fieldset');
  var checkbox;

  for (var i = 0; i < fieldset.length; i++)
  {
    checkbox = fieldset[i].getElementsByTagName('input')[0];
    addListener(checkbox);
  }
}

function addListener(checkbox) 
{
  if (checkbox.addEventListener)
  {
    // For standards complient browsers
    checkbox.addEventListener('click', function() {checkboxClickHandler(checkbox);}, false);
  }
  else if (checkbox.attachEvent)
  {
    // For ie6, ie7
    checkbox.attachEvent('onclick', function() {checkboxClickHandler(checkbox);});
  }
  else
  {
    alert('This page was not meant to be viewed using an older browser, so some features may not work.');
  }
}

// Whenever the user clicks the first checkbox in fieldset,
// update the rest of the checkboxes to reflect the state
// of the first checkbox.
//
// The intention is to allow the that user to check all
// the checkboxes of a particilar Office by simply checking
// the first checkbox of that Office.
function checkboxClickHandler(checkbox) 
{
  // Note: `checked` is an attribute of the checkbox the returns
  // the boolean true if the checkbox is checked, or false otherwise.

  // Save the new state of the first checkbox for later reference.
  var newState = checkbox.checked;

  // Get all the checkboxes in the fieldset.
  var fieldset = checkbox.parentElement.parentElement;
  var checkboxColumn = fieldset.getElementsByTagName('input');

  // Iterate through the rest of the checkboxes and force them
  // to have the same state as the first checkbox.
  for (var i = 1; i < checkboxColumn.length; i++)
  {
    checkboxColumn[i].checked = newState;

    if (newState)
    {
      addToSelectedPrograms(checkboxColumn[i].value);
    }
    else
    {
      removeFromSelectedPrograms(checkboxColumn[i].value);
    }
  }
}

function addEventListenersToCheckboxes() 
{
  var fieldset, checkboxColumn, i, j;

  fieldset = document.getElementsByTagName('fieldset');

  for (i = 0; i < fieldset.length; i++)
  {
    checkboxColumn = fieldset[i].getElementsByTagName('input');
    for (var j = 1; j < checkboxColumn.length; j++)
    {
      addListenerToCheckbox(checkboxColumn[j]);
    }
  }
}

function addListenerForCheckbox(element)
{
  if (element.addEventListener)
  {
    // For standards complient browsers
    element.addEventListener('click', function() {updateSelectedPrograms(element);}, false);
  }
  else if (element.attachEvent)
  {
    // For ie6, ie7
    element.attachEvent('onclick', function() {updateSelectedPrograms(element);});
  }
  else
  {
    alert('This page was not meant to be viewed using an older browser, so some features may not work.');
  }
}

function updateSelectedPrograms(program) 
{
  var programName = program.value;
  if (program.checked)
  {
    addToSelectedPrograms(programName);
  }
  else
  {
    removeFromSelectedPrograms(programName);
  }
}

// I'm populating the hidden field `hdnSelectedPrograms` with the names
// of the programs selected by the user. The names are separated by commas.
//
// Note:
// As the user selects a program, I add the program's name to the hidden field called
// `hdnSelectedPrograms`. This field is shared by both the client-side code
// and the server-side code. The strategy of using a hidden field to communicate
// user changes to the server is used throughout this javascript code.

// Add the string containing our programName to the comma delimited list
// of programNames to search.
function addToSelectedPrograms(programName) 
{
  var hdnSelectedPrograms = document.getElementById('hdnSelectedPrograms');

  var r = new RegExp(programName, 'i');

  if (hdnSelectedPrograms.value.length == 0)
  {
   hdnSelectedPrograms.value = programName;
  }
  else if (hdnSelectedPrograms.value.search(r) == -1)
  {
   hdnSelectedPrograms.value = hdnSelectedPrograms.value + ',' + programName;
  }

}

// Remove programName from hdnSelectedPrograms.
function removeFromSelectedPrograms(programName) 
{
  var hdnSelectedPrograms = document.getElementById('hdnSelectedPrograms');
  var regex;

  // If the list of programNames has a comma in it, use a different regex.
  if (hdnSelectedPrograms.value.search(',') != -1)
  {
    regexp = new RegExp(',' + programName + '|' + programName + ',', 'i');
  }
  else
  {
    regexp = new RegExp(programName, 'i');
  }

  hdnSelectedPrograms.value = hdnSelectedPrograms.value.replace(regexp, '');

}

// Clears out all fields in Advanced Search.
function clearForm()
{
  // Clear filename of search results from Plover
  document.getElementById('hdnSearchResultsFilename').value = '';

  // Clear coordinates
  document.getElementById('hdnLat').value = '';
  document.getElementById('hdnLng').value = '';

  // Clear out all the text boxes (except for radius)
  document.getElementById('txtSearchLocation').value = '';
  document.getElementById('txtPloverID').value = '';
  document.getElementById('txtFacilityName').value = '';
  document.getElementById('txtStreetNumber').value = '';
  document.getElementById('txtStreetName').value = '';
  document.getElementById('txtZipCode').value = '';

  // Clear dropdown list.
  document.getElementById('ddlCity').value = '';

  // Clear the hidden field that stores the selected programs, and uncheck
  // all checkboxes.
  document.getElementById('hdnSelectedPrograms').value = '';
  var checkbox = document.getElementById('fieldSetContainer').getElementsByTagName('input');
  for (var i = 0; i < checkbox.length; i++)
  {
    if (checkbox[i].checked)
    {
      checkbox[i].checked = false;
    }
  }

  // Clear the warning box if it's visible and the contents of the box.
  var warningBox = document.getElementById('unplaceables');
  var link = warningBox.getElementsByTagName('a')[0];
  var listOfUnplaceables = document.getElementById('unplaceable_list');
  if (link) { warningBox.removeChild(link); }
  if (listOfUnplaceables) {warningBox.removeChild(listOfUnplaceables); }
  warningBox.style.display = 'none';


  // Clear the map of markers.
  if (markersOnMap.length > 0) {
    for (var i = 0; i < markersOnMap.length; i++) {
      markersOnMap[i].setMap(null);
    }
    markersOnMap.length = 0;
  }

}

function initialize() 
{
  var map = createMap();
  setupAutocomplete(map);
  if (document.getElementById('hdnIsAdvancedSearchVisible').value === 'yes')
  {
    document.getElementById('simpleSearch').style.display = 'none';
    document.getElementById('advancedSearch').style.display = 'block';
    document.getElementById('showAdvancedParameters').innerHTML = 'General Search';
  }
  processSearchResults(map);
  setCheckboxListener();
  addEventListenersToCheckboxes();
}
