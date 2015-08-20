$(document).ready(function() {
    var ChatApp = ChatApp || {};
    ChatApp.messages = [];
    var socket = io.connect('http://localhost:3100');
    var $nick_name = $("#nick_name");
    var $user_location = $("#location");
    var $msg_container = $(".all-msgs");
    var $msg_box = $(".message-box");
    var $send_msg = $(".join-chat");
    var $users_list = $('.users_list');
    ChatApp.user_details = {}
    //Modal to get user information
    $('#user_info').modal('show')
    
     window.onload = function () {
              getLocation(); 

              $.getJSON("https://geoiplookup.wikimedia.org", function(data){
                console.log("Data: " + data);
                });
                
                  // $.get("http://ipinfo.io", function (response) {
                  //   typeof response!='undefined' && typeof response.city!='undefined' ?
                  //      $user_location.val(loc) : $user_location.val('');
                  // }, "jsonp");
         
      }

    function getLocation() {
              if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(showPosition);
              } else { 
                  console.log("Geolocation is not supported by this browser.");
              }
          }

      function showPosition(position) {

          // console.log("Latitude: " + position.coords.latitude + 
          // "<br>Longitude: " + position.coords.longitude);  

           //console.log("http://maps.googleapis.com/maps/api/geocode/json?latlng="+ position.coords.latitude +","+position.coords.longitude +"&sensor=true")

          var xmlHttp = new XMLHttpRequest();
          xmlHttp.open( "GET", "http://maps.googleapis.com/maps/api/geocode/json?latlng="+ position.coords.latitude +","+position.coords.longitude +"&sensor=true", false );
          xmlHttp.send( null );
          var resp=xmlHttp.responseText;
          var json = JSON.parse(resp);
          //console.log(json.results[0].formatted_address);
          var loc = json.results[0].formatted_address;
          $user_location.val(loc);
          var output = document.getElementById("out");
          output.innerHTML = "Location";
          var img = new Image();
           img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + position.coords.latitude + "," + position.coords.longitude + "&zoom=13&size=200x200&sensor=false";
           output.appendChild(img);
      }

        //For Detecting User Location
       // https://geoiplookup.wikimedia.org/
        // $.get("http://ipinfo.io", function (response) {
        //   typeof response!='undefined' && typeof response.city!='undefined' ?
        //      $user_location.val(loc) : $user_location.val('');
        // }, "jsonp");

    //Getting User Information
    $('.user_info').on('click',function(e){
        e.preventDefault();
        if($user_location.val()==''){
            alert('Please Enter Your Location.')
            $("#location").prop('disabled',false);
        }else{
            ChatApp.user_details.nick_name = $nick_name.val()!='' ? $nick_name.val() : 'Anonymous';
            ChatApp.user_details.location = $user_location.val();
            $('#user_info').modal('hide')
            socket.emit('new_user',ChatApp.user_details)
        }
    })

    //Called when a user joins or leave
    socket.on('user_joined',function(data){
        var user_data='';
        $users_list.html('');
        for(var i in data.users){
            var is_active = data.users[i].nick_name==data.current_user.nick_name ? 'class="active"' : '';
            user_data+='<li '+is_active+'><a href="#">'+data.users[i].nick_name+'<div class="user_city">'+data.users[i].location+'</div></a></li>';
        }
        $users_list.html(user_data);
        $msg_container.append('<div class="msg">'+data.current_user.nick_name+' '+data.status+' chat room</div>');
        var user = data.count>1 ? 'users' : 'user';
        $('.user_count').text(data.count+' '+user+' online')
    })

    //Sending Message
    $send_msg.on('click',function(){
        socket.emit('msg_sent',{'message':$('.message-box').val()});
        $('.message-box').val('');
    })

    //When a new message is received
    socket.on('new_message',function(data){
        appendMessage(data.nick_name,data.message)
    });

    //To load old messages to new user
    socket.on('all_message',function(data){
        for(var i = data.length-1; i>=0;i--){
            console.log(data[i],i)
            appendMessage(data[i].nick_name,data[i].message)
        }
    });

    //Appending messages to DOM
    function appendMessage(name,msg){
        $msg_wrapper = $('<div>').attr('class','msg');
        $user = $('<span>').attr('class','name').text(name);
        $message= $('<span>').attr('class','text').text(msg);
        $msg_container.append($msg_wrapper.append($user,$message));
    }


 
})