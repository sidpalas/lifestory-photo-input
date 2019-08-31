const TOTAL_NUM_PHOTOS = 10;

function handleFiles(files, imgNum) {
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    uploadedImages[parseInt(imgNum)-1] = file;
    if (!file.type.startsWith('image/')){ continue }

    let picId = "photoDisplay" + imgNum;
    var img = document.getElementById(picId);
    img.file = file;

    var reader = new FileReader();
    reader.onload = (function(aImg) { return function(e) { aImg.src = e.target.result; }; })(img);
    reader.readAsDataURL(file);
  }
}

// const database = firebase.database();
const ref = firebase.storage().ref();
var uploadedImages = [];

firebase.auth().onAuthStateChanged(function(user){
  window.user = user;
  if (window.user){
      document.querySelector('#submitPhotos').disabled = false;
  }
});


document.querySelector('#loginButton').addEventListener('click', function(e) {
    var uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // User successfully signed in.
        // Return type determines whether we continue the redirect automatically
        // or whether we leave that to developer to handle.
        document.getElementById('loggedInHide').style.display = 'none';
        document.getElementById('loggedInShow').style.display = 'inline';
        document.getElementById('userEmail').innerText = user.email;
        return false;
      },
      uiShown: function() {
        // The widget is rendered.
        // Hide the loader.
        // document.getElementById('loader').style.display = 'none';
        document.getElementById('loginButton').style.display = 'none';
        }
    },
     signInOptions: [
         {
           provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
           requireDisplayName: false
         }
     ],
     // Required to enable one-tap sign-up credential helper.
     credentialHelper: firebaseui.auth.CredentialHelper.NONE
    };
    // Initialize the FirebaseUI Widget using Firebase.
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    // The start method will wait until the DOM is loaded.
    ui.start('#firebaseui-auth-container', uiConfig);
});

document.querySelector('#submitPhotos').addEventListener('click', function(e) {
    let completedPhotos = 0;
    let alertMessage = "";
    let kidName = document.querySelector('#kidName').value.replace(/[.,\/# \'!$%\^&\*;@:{}=\-_`~()]/g,"")
    if (kidName === ""){
        alertMessage += "No name provided. \nPlease input the child's name before submitting!\n\n"
    }

    for (i=0;i<uploadedImages.length;i++){
        if (typeof(uploadedImages[i])!="undefined"){
            completedPhotos++;
        }
    }
    if (completedPhotos < TOTAL_NUM_PHOTOS){
        alertMessage += String(completedPhotos) + "/" + String(TOTAL_NUM_PHOTOS) + " photos completed. \nPlease complete all photos before submitting!";
    }

    if (alertMessage != ""){
        alert(alertMessage);
    }
    else{
        $('#uploadModal').modal('show');

        //should keep a count of the number of uploads per user in the realtime DB and cap them at 30?
        //use function triggered by .onFinalize() to increment?

        let uploadPromiseArray = []
        for (let i=0;i<uploadedImages.length;i++){
            var img = uploadedImages[i];
            var imgNum = i + 1
            var task = ref.child(user.email + '/' + 'dreambook/' + kidName + "/" + String(imgNum).padStart(2,'0')).put(img).then(function(snapshot) {
                var thisNum = snapshot.metadata.name;
                document.querySelector('#uploadStatus').innerText += "\nPhoto #" + thisNum + " has finished uploading!"
                });
            uploadPromiseArray.push(task);
        }
        Promise.all(uploadPromiseArray).then(function(){
            $('#uploadModal').modal('hide');
            alert('Upload complete, thank you! \n\nWe will be in touch regarding delivery of your book! \n\nIf you have another set of photos to input, simply refresh the page and you can input the additional set.')
        });
    }
});
