// ReadSpeaker
(function() {
    window.rsConf={
        params:"https://sf1-na.readspeaker.com/script/default/canvas/ReadSpeaker.js?pids=embhl&skin=ReadSpeakerToggleSkin2"
    };
    window.rsConf.toggle={
        customerParams:{customerid:"8840",lang:["en_us"],region:"na",voice:null,readid:null,url:null
    },
    addPreserve:[".nav"],addSkip:[".nav"],
    readids:["course_home_content","discussion_container","assignment_show","content"],
    useIcons:!0
};
    var d=document.getElementsByTagName("HEAD").item(0),a=document.createElement("script");
    a.setAttribute("type","text/javascript");
    a.src="https://sf1-na.readspeaker.com/script/default/canvas/ReadSpeaker.js";
    var b=function(){
        ReadSpeaker.init()
    };
    a.onreadystatechange=a.onload=function(){
        var c=a.readyState;
        if(!b.done&&(!c||/loaded|complete/.test(c)))
            b.done=!0,b();
        ReadSpeaker.q(function(){
            ReadSpeaker.Toggle.init()
        })
    };
    (document.body||d).appendChild(a)
}
)
();