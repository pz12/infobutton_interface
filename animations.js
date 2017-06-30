$(document).ready(function() {

  // activated when a drowpdown menu item is clicked
  $('.dropdown-wrapper').click(function(e) {
    e.stopPropagation(); //allows the menu to appear
    document.getElementById("dd").classList.toggle("active");
  });

  //If clicked outside the dropdown, close the list
  $(document).click( function(){
    if($("#dd").hasClass("dropdown-wrapper active")) {
      document.getElementById("dd").classList.remove("active");;
    }
  });

  var patient_list = ["Peter Chalmers", "Jane Wallaby", "Eustache Mullen"];
  var init_file = "patients/peter_chalmers.json"; // Starts with Peter by default
  upload_json(init_file);
  //Add the names to the dropdown list for selection
  for(var i=0; i<patient_list.length;i++) {
    var a = document.createElement("a");
    var ulist = document.getElementById("dd_list");
    var newItem = document.createElement("li");
    a.textContent = patient_list[i]; //Puts patient name in as text
    a.id = patient_list[i];  //Puts the patient name as the id of the "li a" element
    newItem.appendChild(a);  //Adds the link to the "li" list element
    ulist.appendChild(newItem); //Adds the "li" element to the "ul" list
  }
    //iteratively adds a 'click' element to each of the list items
  $("#dd_list li a").on('click',function(e) {
    choose_person($(this).attr('id')); //Uploads the new json file after click is made
    //Restart page to the "profile" tab when a new person is selected
    $('.tabs #tab1').show().siblings().hide();
    $('#profile').addClass('active').siblings().removeClass('active');
    //Restart problem and medication tabs to "active" when a new person is selected
    $('.sub-tabs #active-m').show().siblings().hide();
    $('#activeTabM').addClass('active').siblings().removeClass('active');
    $('.sub-tabs #active-p').show().siblings().hide();
    $('#activeTabP').addClass('active').siblings().removeClass('active');
    e.preventDefault(); //Page won't scroll up when new person is selected
    return false;
  });
  //Transforms upper cased name to firstname_lastname format
  //  and loads json info for that patient
  function choose_person(name){
    name = name.split(" ");
    name = name[0].toLowerCase()+"_"+name[1].toLowerCase();
    file = "patients/"+name+".json";
    upload_json(file);
  }
  //When patient is selected from dropdown, the menu will close automatically
  $(".dropdown-wrapper .dropdown li a").click(function() {
    document.getElementById("dd").classList.remove("active");
  });
  //When tabs are clicked
  $('.tabs .tab-links a').click(function(e) {
    var currentAttrValue = $(this).attr('href');
    // Show/Hide Tab content
    $('.tabs ' + currentAttrValue).show().siblings().hide();
    // Change/remove current tab to active
    $(this).parent('li').addClass('active').siblings().removeClass('active');
    e.preventDefault(); //Stops page from scrolling to top when tab is clicked
    $('accordian').remove('active')
    var panels = document.getElementsByClassName("panel");
    var panel;
    //Closes all panels when a new tab is selected
    for (x = 0; x < acc.length; x++) {
      panel = panels[x];
      panel.style.maxHeight = null;
      panel.style.opacity = "0";
      panel.style.padding = null;
      panel.style.backgroundColor = null;
      panel.style.border = null;
      panel.style.width = null;
      panel.style.marginLeft = null;
      panel.style.fontSize = null;
    }
  });
  //When "Active" and "Inactive" tabs are clicked
  $('.sub-tabs .sub-tab-links a').click( function(e) {
    var currentAttrValue = $(this).attr('href');
    // Show/Hide sub tab Content
    $('.sub-tabs ' + currentAttrValue).show().siblings().hide();
    // Change/remove current tab to active
    $(this).parent('li').addClass('active').siblings().removeClass('active');
    $('.accordion').remove("active")
    e.preventDefault();
  });
  //Formats the Date objects to be in mm/dd/yyy format
  Date.prototype.mmddyyyy = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
    return [(mm>9 ? '' : '0') + mm,
            (dd>9 ? '' : '0') + dd,
            this.getFullYear(),
          ].join('/');
  };
  var date = new Date();
  var curr_date = date.mmddyyyy();
  document.getElementById("date").innerHTML = curr_date; //Date at top of page
  date.setDate(date.getDate()-5);
  //Inputs "Last Updated" dates
  document.getElementById("allergy_date").innerHTML = date.mmddyyyy();
  document.getElementById("list_date").innerHTML = date.mmddyyyy();
  document.getElementById("history_date").innerHTML = date.mmddyyyy();

  //Reformat date strings to be mm/dd/yyy format
  function convertDate(date) {
    date = date.split("-");
    date = date[1]+"/"+date[2]+"/"+date[0];
    return date;
  };
  //Takes words and capatalizes them
  function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase()
            + txt.substr(1).toLowerCase();});
  };
  //accordian code adapted from from https://www.w3schools.com/howto/howto_js_accordion.asp
  //captures all of the list "accordian" items
  var acc = document.getElementsByClassName("accordion");

  //Inputs all the data found in the FHIR json files
  function upload_json(file) {
    $.getJSON(file, function(json) {
      var bundle = json.entry; //bundle is a list of the different resources
      //All ".empty()" functions empty out the past patient info to leave room when a new patient is selected
      $('#contact').empty();
      $("#inpatient").empty();
      $("#outpatient").empty();
      var inpatient = [];
      var outpatient = [];

      $("#allergy_list").empty();
      var lis = $("#allergy_list").append("<ul></ul>").find("ul"); //Starts the list to be added to later
      var index_list = [];

      var allergy_list = [];
      var todo_list = [];
      $("#to_do_table").empty();
      $("#to_do_table").append("<tr><th>Action</th><th>Date</th><th>Provider</th></tr>"); //Starts the table to be added to later

      $("#active-p").empty()
      $("#inactive-p").empty()
      //Will be used to say whether the problem list is empty
      var active_flagP = false;
      var inactive_flagP = false;

      $("#active-m").empty()
      $("#inactive-m").empty()
      var medArr = ["MedicationStatement","MedicationRequest","MedicationOrder","MedicationDispense"];
      //Will be used to say whether the medication list is empty
      var active_flagM = false;
      var inactive_flagM = false;

      $("#gene_list").empty()
      var gene_count = 0;

      //This loops across the list of resources in the patient "Bundle"
      for (var i=0; i<bundle.length;i++) {
        if(bundle[i].resource.resourceType==="Patient") { //This will give all of the demographics
          var contact_length = bundle[i].resource.telecom.length;
          for(var j=0;j<contact_length;j++) {  //loops over the contact means (i.e. telephone, email, etc.)
            var value = bundle[i].resource.telecom[j].value;
            var system = bundle[i].resource.telecom[j].system;
            if(bundle[i].resource.telecom[j].use) {
              var use = bundle[i].resource.telecom[j].use;
              $('#contact').append("<p><b>"+toTitleCase(use)+" "+toTitleCase(system)+":</b> "+value+"</p>");
            }
            else {
              $('#contact').append("<p><b>"+toTitleCase(system)+":</b> "+value+"</p>");
            }
            if (i===1) {  //Ensures that only 2 of the forms of contact are shown
              contact_length = 2;
              break;
            }
          }
          document.getElementById("first_name1").innerHTML = bundle[i].resource.name[0].given[0];
          document.getElementById("last_name1").innerHTML = bundle[i].resource.name[0].family;
          document.getElementById("patient_id1").innerHTML = bundle[i].resource.id;
          document.getElementById("first_name2").innerHTML = bundle[i].resource.name[0].given[0];
          document.getElementById("last_name2").innerHTML = bundle[i].resource.name[0].family;
          document.getElementById("patient_id2").innerHTML = bundle[i].resource.id;
          document.getElementById("middle_name").innerHTML = bundle[i].resource.name[0].given[1];
          document.getElementById("address_line").innerHTML = bundle[i].resource.address[0].line[0];
          document.getElementById("address_city").innerHTML = bundle[i].resource.address[0].city;
          document.getElementById("address_state").innerHTML = bundle[i].resource.address[0].state;
          document.getElementById("address_zip").innerHTML = bundle[i].resource.address[0].postalCode;
          document.getElementById("DOB").innerHTML = convertDate(bundle[i].resource.birthDate.substring(0,10));
          document.getElementById("gender").innerHTML = bundle[i].resource.gender.charAt(0).toUpperCase() + bundle[i].resource.gender.slice(1);
          var pic = document.querySelector("#profile_pic");
          var gender = bundle[i].resource.gender;
          //images from http://www.iconarchive.com/show/free-large-boss-icons-by-aha-soft.html
          if (gender === "male" || gender === "Male") {
            image = "images/male.png";
            pic.src = image;
          }
          else {
            image = "images/female.png";
            pic.src = image;
          }
          // Will only add these if they're available
          if(bundle[i].resource.communication) {
            document.getElementById("language").innerHTML = bundle[i].resource.communication[0].language.coding[0].display;
          }
          else {
            document.getElementById("language").innerHTML = " ";
          }
          if(bundle[i].resource.contact) {
            document.getElementById("emergency_name").innerHTML = bundle[i].resource.contact[0].name.given[0]+" "
              +bundle[i].resource.contact[0].name.family;
            document.getElementById("emergency_phone").innerHTML = bundle[i].resource.contact[0].telecom[0].value;
          }
          else {
            document.getElementById("emergency_name").innerHTML = ' ';
            document.getElementById("emergency_phone").innerHTML = " ";
            if(contact_length===2) {
              var dist = document.querySelector("#right");
              dist.style.marginBottom = "38px";  //Adds some margin to compensate for the additional contact info
            }
          }
        }

        if(bundle[i].resource.resourceType === "AllergyIntolerance") {
          var item = bundle[i].resource.code.coding[0].display;
          var list_item = $("<li></li>").text(item);
          lis.append(list_item);
          allergy_list.push(i);
        }

        if(bundle[i].resource.resourceType === "Appointment") {
          var action = bundle[i].resource.description;
          var date = bundle[i].resource.start;
          date = date.substring(0,10);
          date = convertDate(date);
          var provider = bundle[i].resource.participant[1].actor.display;
          $("#to_do_table").append("<tr><td>"+action+"</td><td>"+date+"</td><td>"+provider+"</td></tr>");
          todo_list.push(i);
        }

        if(bundle[i].resource.resourceType === "Encounter") {
          if(bundle[i].resource.class.display === "inpatient") {
            inpatient.push(1);
            var head =bundle[i];
            var date = head.resource.period.start;
            date = convertDate(date);
            for(var j=0; j<head.resource.participant.length;j++) {
              if(head.resource.participant[j].individual.reference==="Practitioner"){
                var name = head.resource.participant[j].individual.display;
              }
            }
            $("#inpatient").append("<p style=\"margin-top:5px;\">"+date+"&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp"+name+"</span></br>");
          }
          else {
            outpatient.push(1);
            var head = bundle[i];
            var date = head.resource.period.start;
            date = convertDate(date);
            for(var j=0; j<head.resource.participant.length;j++) {
              if (head.resource.serviceProvider) {
                if(head.resource.participant[j].individual.reference==="Practitioner"){
                  var name = head.resource.serviceProvider.display+" - "+head.resource.participant[j].individual.display;
                }
              }
              else {
                var name = head.resource.participant[j].individual.display;
              }
            }
              $("#outpatient").append("<p style=\"margin-top:5px;\">"+date+"&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp"+name+"</p>");
          }
        }

        if(bundle[i].resource.resourceType === "Condition") {
          var display = bundle[i].resource.code.text;
          var display_list = display.split(" ");
          display = toTitleCase(display);
          var search_term = "";
          var text = "";
          for (var j=0;j<display_list.length;j++) {
            if(j<display_list.length-1) {
              search_term += display_list[j]+"%20";
            }
            else {
              search_term += display_list[j];
            }
          }
          var date = bundle[i].resource.onsetDateTime;
          date = date.substring(0,10);
          if(!date) {
            date = "Unknown";
          }
          else {
            date = convertDate(date);
          }

          var note = bundle[i].resource.note;
          if(bundle[i].resource.meta) {
            var lastUpdated =  bundle[i].resource.meta.lastUpdated;
            lastUpdated = lastUpdated.substring(0,10);
            lastUpdated = convertDate(lastUpdated);
            text += "<p><b>Last Updated: </b>"+lastUpdated+"</p>";
          }
          if(note) {
            text +="<p><b>Notes: </b>"+note+"</p>";
          }
          var status = bundle[i].resource.clinicalStatus;
          var code = bundle[i].resource.code.coding.code;
          var http = "http://service.oib.utah.edu:8080/infobutton-service/infoRequest?representedOrganization.id.root=1.3.6.1.4.1.5884"
            +"&taskContext.c.c=PROBLISTREV&mainSearchCriteria.v.c="+code+"&mainSearchCriteria.v.cs=2.16.840.1.113883.6.96&mainSearchCriteria.v.dn="+search_term
            +"&informationRecipient.languageCode.c=en&performer=PROV&xsltTransform=Infobutton_UI"
          if(status==="active"||status=="recurrence") {
            if (!active_flagP) {
              $("#active-p").append("<div class=\"accordion\" style=\"margin-top:-5px;\">" +display
                +"<a href="+http+" target=\"_blank\"> <img class=\"infobutton\" src=\"images/infobutton_icon.png\"/></a></div>");
            }
            else {
              $("#active-p").append("<div class=\"accordion\">" +display+"<a href="+http
                +" target=\"_blank\"> <img class=\"infobutton\" src=\"images/infobutton_icon.png\"/></a></div>");
            }
            active_flagP = true;
            $("#active-p").append("<div class=\"panel\"><p><b>Since: </b>"+date+"</p><span>"+text+"</span></div>");
          }
          else {
            if (!inactive_flagP) {
              $("#inactive-p").append("<div class=\"accordion\" style=\"margin-top:-5px;\">" +display+"<a href="+http
                +" target=\"_blank\"> <img class=\"infobutton\" src=\"images/infobutton_icon.png\"/></a></div>");
            }
            else {
              $("#inactive-p").append("<div class=\"accordion\">" +display+"<a href="+http
                +" target=\"_blank\"> <img class=\"infobutton\" src=\"images/infobutton_icon.png\"/></a></div>");
            }
              inactive_flagP = true;
              $("#inactive-p").append("<div class=\"panel\"><p><b>Since: </b>"+date+"</p><p>"+text+"</p></div>");
          }
        }

        var resourceName = bundle[i].resource.resourceType;
        if($.inArray(resourceName, medArr)!== -1) {  //will catch both medication orders and dispensed
          var display = bundle[i].resource.medicationCodeableConcept.text;
          var status = bundle[i].resource.status;
          var search_term= display.match(/(\w+\s?\D*)/); //Giving what we want, but twice
          if (search_term[0].slice(-1)===" "){
              search_term = search_term[0].slice(0,-1); //take off space at the end
          }
          else {
            search_term = search_term[0];
          }
          display = toTitleCase(display);
          var text = "";
          var display_list = search_term.split(" ");
          if(display_list.length>1) {  //will make the medication name searchable
            search_term = "";
            for (var j=0;j<display_list.length;j++) {
              if(j<display_list.length-1) {
                search_term += display_list[j]+"%20";
              }
              else {
                search_term += display_list[j];
              }
            }
          }
          else if(status==="completed"||status==="stopped"){
            if (resourceName==="MedicationDispense") {
              if(bundle[i].resource.whenHandedOver) {
                var startDate = bundle[i].resource.whenHandedOver;
              }
              else {
                startDate = "Unknown";
              }
            }
          }

          var note = bundle[i].resource.note;
          if(bundle[i].resource.meta) {
            var lastUpdated =  bundle[i].resource.meta.lastUpdated;
            lastUpdated = lastUpdated.substring(0,10);
            lastUpdated = convertDate(lastUpdated);
            text += "<p><b>Last Updated: </b>"+lastUpdated+"</p>";
          }
          if(note) {
            text +="<p><b>Notes: </b>"+note+"</p>";
          }
          var rxnorm_code = bundle[i].resource.medicationCodeableConcept.coding[0].code;
          var http = "http://service.oib.utah.edu:8080/infobutton-service/infoRequest?representedOrganization.id.root=1.3.6.1.4.1.5884"
            +"&taskContext.c.c=MLREV&mainSearchCriteria.v.c="+rxnorm_code+"&mainSearchCriteria.v.cs=2.16.840.1.113883.6.88&mainSearchCriteria.v.dn="+search_term
            +"&informationRecipient.languageCode.c=en&informationRecipient=PROV&performer=PROV&xsltTransform=Infobutton_UI"
          if(status==="in-progress"||status==="active") {
            if (!active_flagM) {
              $("#active-m").append("<div class=\"accordion\" style=\"margin-top:-5px;\">" +display
                +"<a class=\"infob\" href="+http+" target=\"_blank\"> <img class=\"infobutton\" src=\"images/infobutton_icon.png\"/></a></button>");
            }
            else {
              $("#active-m").append("<div class=\"accordion\">" +display
                +"<a class=\"infob\" href="+http+" target=\"_blank\"> <img class=\"infobutton\" src=\"images/infobutton_icon.png\"/></a></button>");
            }
            active_flagM = true;
            $("#active-m").append("<div class=\"panel\"><p><b>Since: </b>"+startDate+"</p><span>"+text+"</span></div>");
          }
          else {
            if (!inactive_flagM) {
              $("#inactive-m").append("<div class=\"accordion\" style=\"margin-top:-5px;\">" +display
                +"<a class=\"infob\" href="+http+" target=\"_blank\"> <img class=\"infobutton\" src=\"images/infobutton_icon.png\"/></a></div>");
            }
            else {
              $("#inactive-m").append("<div class=\"accordion\">" +display
                +"<a class=\"infob\" href="+http+" target=\"_blank\"> <img class=\"infobutton\" src=\"images/infobutton_icon.png\"/></a></div>");
            }
            inactive_flagM = true;
            $("#inactive-m").append("<div class=\"panel\"><p>"+text+"</p></div>");
          }
        }

        if (bundle[i].resource.resourceType==="Observation") {
          var pdf = bundle[i].resource.related[0].target.reference;
          pdf = "gene_reports/"+pdf;
          var note = bundle[i].resource.comment;
          gene_count += 1;
          var gene_list = bundle[i].resource.extension;
          //Initialize variables in case they don't exist in file
          var gene = variant = aa_change = zygosity = ".......";
          var snp_label = snp = "";
          for (var j=0;j<gene_list.length;j++) {
            if (gene_list[j].url.indexOf("geneticsGene") !== -1) {
              gene = gene_list[j].valueCodeableConcept.coding[0].display;
            }
            if(gene_list[j].url.indexOf("SequenceVariantName") !== -1) {
              variant = gene_list[j].valueCodeableConcept.coding[0].display;

              var variant_url;
              if (variant.indexOf(">") !== -1) {
                //Need to replace '>' because it's an invalid url character
                variant_url = variant.replace(">", "%3E");
              }
              else {
                variant_url = variant;
              }
              variant = variant.split(":");
              variant = variant[1];
            }
            if(gene_list[j].url.indexOf("aminoacidchangename") !== -1) {
              aa_change = gene_list[j].valueCodeableConcept.coding[0].display;
              aa_change = aa_change.split(":");
              aa_change = aa_change[1];
            }
            if(gene_list[j].url.indexOf("allelicstate") !== -1) {
              zygosity = gene_list[j].valueCodeableConcept.coding[0].display;
            }

            if(gene_list[j].url.indexOf("DNAVariantId") !== -1) {
              snp = gene_list[j].valueCodeableConcept.coding[0].display;
              snp_label = "SNP: ";

            }


          }

          var httpG = "http://service.oib.utah.edu:8080/infobutton-service/infoRequest?representedOrganization.id.root=ClinicalGenome.org"
            +"&taskContext.c.c=LABRREV&mainSearchCriteria.v.dn="+gene+"&performer=PROV";
          var httpV = "http://service.oib.utah.edu:8080/infobutton-service/infoRequest?representedOrganization.id.root=ClinicalGenome.org&"
            +"taskContext.c.c=LABRREV&mainSearchCriteria.v.dn="+variant_url+"&performer=PROV";

          if(gene_count===1) {
            $("#gene_list").append("<div class=\"accordion\" style=\"margin-top:15px;\">"+gene
              +" <a class=\"infob\" href="+httpG+" target=\"_blank\"><img class=\"infobutton\" src=\"images/infobutton_icon.png\"/></a>"
              +"<div class=\"variant_text\">"+variant+" <a href="+httpV+" target=\"_blank\"> <img class=\"infobutton\" src=\"images/infobutton_icon.png\"/></a>"
              +"<div class=\"AA_text\">"+aa_change+"</div><div class=\"zygosity_text\">"+zygosity+"</div></div></div>");
          }
          else{
            $("#gene_list").append("<div class=\"accordion\">"+gene+" <a class=\"infob\" href="+httpG+" target=\"_blank\">"
              +"<img class=\"infobutton\" src=\"images/infobutton_icon.png\"/></a><div class=\"variant_text\">"+variant+"<a href="+httpV+" target=\"_blank\">"
              +"<img class=\"infobutton\" src=\"images/infobutton_icon.png\"/></a><div class=\"AA_text\">"+aa_change
              +"</div><div class=\"zygosity_text\">"+zygosity+"</div></div></div>");
          }
          $("#gene_list").append("<div class=\"panel\"><p class=\"report_text\"><b>Clinical Significance:</b> "+note+"</p>"
            +"<p class=\"report_text\"><i>"+snp_label+"</i>"+snp+"</p><p class=\"report_link\"><a href="+pdf
            +" target=\"_blank\"> Click here</a> for full report</p></div>");
        }
      }
      for (var i = 0; i < acc.length; i++) {

        acc[i].onclick = function(e,i) {

          var panels = document.getElementsByClassName("panel");
          var pan;

          var panel = this.nextElementSibling;
          if (panel.style.maxHeight){
            panel.style.maxHeight = null;
            panel.style.opacity = "0";
            panel.style.padding = null;
            panel.style.backgroundColor = null;
            panel.style.border = null;
            panel.style.width = null;
            panel.style.marginLeft = null;
            panel.style.fontSize = null;
          }
          else {
            panel.style.opacity = "1";
            var height = panel.scrollHeight + 20;
            panel.style.maxHeight = height + "px";
            panel.style.padding = "8px 15px";
            panel.style.backgroundColor = "white";
            panel.style.border = "1px solid rgb(137, 136, 145)";
            panel.style.width = "90.3%";
            panel.style.marginLeft = "15px";
            panel.style.fontSize = "15px";
            panel.style.marginBottom = "-1px";
          }
        }
      }
      $(".infobutton").click(function(e) {
        //list item will not be opened when the infobutton is clicked
        e.stopPropagation();
      });
      if(inpatient.length>outpatient.length) {
        var diff = inpatient.length-outpatient.length;
        var marg_length = diff*24;
        var marg_dist = document.querySelector("#admissions");
        marg_dist.style.marginBottom = marg_length+"px";
      }

      var allergy_list_len = allergy_list.length;
      var todo_list_len = todo_list.length;
      if (allergy_list_len>todo_list_len+1) {
        if (allergy_list_len === 4) {
          var marg_dist = document.querySelector("#to_do");
          marg_dist.style.paddingBottom = "5px";
        }
        else if (allergy_list_len === 5) {
          var marg_dist = document.querySelector("#to_do");
          marg_dist.style.paddingBottom = "22px";
        }
        else if (allergy_list_len === 6) {
          var marg_dist = document.querySelector("#to_do");
          marg_dist.style.paddingBottom = "38px";
        }
        else {
          var diff = allergy_list_len-todo_list_len;
          var marg_length = diff*13;
          var marg_dist = document.querySelector("#to_do");
          marg_dist.style.paddingBottom = marg_length+"px";
        }
      }
      else {
        var marg_dist = document.querySelector("#to_do");
        marg_dist.style.marginBottom = "-5px";
      }

      if(!active_flagP) {
          $("#active-p").append("<div class=\"empty-list\"></div>");
      }
      if(!inactive_flagP) {
        $("#inactive-p").append("<div class=\"empty-list\"></div>");
        inactive_flagP = true;
      }
      if(!active_flagM) {
          $("#active-m").append("<div class=\"empty-list\"></div>");
          active_flagM = true;
      }
      if(!inactive_flagM) {
        $("#inactive-m").append("<div class=\"empty-list\"></div>");
        inactive_flagM = true;
      }
    });

  };


});
