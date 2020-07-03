import React, { useState,useEffect,useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import styled from 'styled-components';
import './room.css';
// import {Container,Row,Col} from 'react-bootstrap';



const Input = styled.input`
    
    color:white;
    background: transparent;
    border: none;
    border-bottom: 1px solid white;
`;
const Container = styled.div`
    background-color:black;
    display: flex;
    width: 100%;
    height: 100vh;
    flex-direction: row;
`;

const LeftRow = styled.div`
    width: 40%;
    height: 100%;
`;

const RightRow = styled.div`
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Video = styled.video`
    height:50%;
    width: 100%;
    border: 1px solid black;
`;

const Room=(props)=>{
    const socketRef=useRef();
    const userRef=useRef();
    const partnerRef=useRef();
    const PeerRef=useRef();
    const youtubePlayer=useRef();

    const [videoID,setVideoID]=useState('');
    
    
    useEffect(()=>{
        navigator.mediaDevices.getUserMedia({video:true,audio:true}).then((stream)=>{
            
                userRef.current.srcObject=stream;

                socketRef.current=io.connect('/');
                // console.log("hello");
                // console.log(props.match.params.roomID);

                
                socketRef.current.emit("join room",props.match.params.roomID);
                
                socketRef.current.on("other user",(PartnerID)=>{
                    console.log("creator");
                    if(PartnerID){
                        console.log("partner");
                        PeerRef.current=createPeer(PartnerID,socketRef.current.id,stream);
                    }
                });

                


                socketRef.current.on("caller signal",(incoming)=>{
                    console.log("Caller signal from browser");
                    PeerRef.current=addPeer(incoming.CallerID,incoming.signal,stream);
                    
                });
                socketRef.current.on("callee signal",(incoming)=>{
                    console.log("callee signal from browser"); 
                    PeerRef.current.once("error",(error)=>{
                        console.log("Warning"+error);
                    });
                    //PeerRef.current=testPeer(signal,stream);    
                    PeerRef.current.signal(incoming.signal);
                });

        })
        

    },[]);
    useEffect(() => {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = loadVideoPlayer;
    }, []);
    let previousTime;
    let previousAction;
    function onPlayerStateChange(event) {
        
        console.log("inside fun");
        if(event.data != 3) {
            
            if (event.data == 1) {
                
                if((event.target.getCurrentTime()-previousTime)>1)
                    seekchange(event.target.getCurrentTime());
                playVideo();
                
              }
             else if(event.data==2){
                pauseVideo();
            } // we don't need to detect buffering
            
       
     }
else{
     const currentTime = event.target.getCurrentTime();
     
    if (Math.abs(previousTime - currentTime) > 1 ) {
        // we have Seek event and we have time when it was started(previousTime). Also we have finish time of Seek event(currentTime).
        console.log("seek");
        seekchange(currentTime);
     }
     previousTime = currentTime;
     previousAction = event.data;
    }

   
    }

   
    function loadVideoPlayer() {
        const player = new window.YT.Player('player', {
            
            height: '390',
            width: '640',
            playerVars: { 
                'autoplay': 0,
                'controls': 1, 
                'rel' : 0,
                'fs' : 1,
            },
            events:{
                onStateChange:onPlayerStateChange,
                
            }
            
        });
        
        
        youtubePlayer.current = player;
    }
    
    function handleStream(stream){
        partnerRef.current.srcObject=stream;
        
    }
    function handleData(data)
    {
        const parsed = JSON.parse(data);
        if(parsed.type==="newVideo")
        {
            if(parsed.data.indexOf("=")==-1)
            {
                
                youtubePlayer.current.loadVideoById(parsed.data.split(".be/")[1]);
                console.log(parsed.data.split(".be/")[1]);
                
            }
            else{
                youtubePlayer.current.loadVideoById(parsed.data.split("=")[1]);
            }
        }
        else if(parsed.type==="pause")
        {
            youtubePlayer.current.pauseVideo();
        }
        else if(parsed.type=="play"){
            youtubePlayer.current.playVideo();
        }
        else
        {
            youtubePlayer.current.seekTo(parsed.data,true);
            youtubePlayer.current.playVideo();
        }
    }
    const createPeer = (PartnerID,CallerID,stream) =>{
        const peer = new Peer({
            initiator:true,
            trickle:false,
            stream:stream,
            config:{
                'iceServers': [{
                    url: 'stun:stun1.l.google.com:19302'
                  },
                  {
                    url: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                }
            ]
            }
        });
        peer.on("signal",(signal)=>{
            const payload={
                PartnerID,
                CallerID,
                signal
            }
            //peer.signal(signal);
            socketRef.current.emit("call partner",payload);
            
        });

        
        peer.on("stream",handleStream);
        peer.on("data",handleData);
        
        return peer;
    }

    const addPeer = (CallerID,insignal,stream) =>{
        console.log("inside addpeer");
        const peer = new Peer({
            initiator:false,
            trickle:false,
            stream:stream,
            config:{
                'iceServers': [{
                    url: 'stun:stun1.l.google.com:19302'
                  },
                  {
                    url: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                }
            ]
            }
        });
        peer.on("signal",(signal)=>{
            console.log("inside peer");
            const payload={
                CallerID,
                signal
            }
            socketRef.current.emit("accept call",payload);
        });
        peer.once("error",(error)=>{
            console.log("peer error"+error);
        });
        peer.on("stream",handleStream);
        peer.on("data",handleData);
        peer.signal(insignal);
        
        return peer;
    }

    function seekchange(t)
    {
        PeerRef.current.send(JSON.stringify({type:"seek",data:t}));
        //youtubePlayer.current.seekTo(t,false);
        console.log(t);
    }
    
    function loadVideo() {
        PeerRef.current.send(JSON.stringify({type: "newVideo", data: videoID}));
        if(videoID.indexOf("=")==-1)
        {
            
            youtubePlayer.current.loadVideoById(videoID.split(".be/")[1]);
            console.log(videoID.split(".be/")[1]);
            
        }
        else{
            youtubePlayer.current.loadVideoById(videoID.split("=")[1]);
        }
        
    }
    function playVideo(){
        PeerRef.current.send(JSON.stringify({type:'play'}));
        youtubePlayer.current.playVideo();
    }
    function pauseVideo(){
        PeerRef.current.send(JSON.stringify({type:'pause'}));
        youtubePlayer.current.pauseVideo();
    }
    

    return(
        <div>
        <nav className="navbar" style={{height:"50px",backgroundColor:"red"}}>
        
        <h4 style={{color:"black"}}><i className="youtube icon large"></i>Youtube Party</h4>
    </nav>
        <div className="container mt-5">
            <br />
            
        
            
            <div className="row">
            
            
            <div className="col-12 col-lg-6">
                <div className="row justify-content-center">
                    <div className="ui inverted segment fluid" id="player" />
                </div>
                <div className="row justify-content-center">
                    <div className="ui inverted segment" style={{backgroundColor:"black"}}>
                        <Input type="text" placeholder="Video link" value={videoID} onChange={e=>setVideoID(e.target.value)}></Input>
                        <br /><br />
                        <button style={{color:"black"}} className="ui red button" onClick={loadVideo}>Load Video</button>
                    </div>
                </div>   
            </div>
            <div className="col-lg-1"></div>
            <div className="col-12 col-lg-5">
                    <div className="row justify-content-center">
                        
                    <Video controls autoPlay ref={partnerRef} />
                    
                    
                    </div>
                    <br />
                
                    <div className="row justify-content-center">
                    
                    
                    <Video muted controls autoPlay ref={userRef} />
                    
                    </div>
                    <br />
                    
                
            </div>
            </div>
        
        </div>
        </div>
        
        
    );
    

}

export default Room;



{/* <Container>
        <LeftRow>
            <Video muted controls autoPlay ref={userRef} />
            <Video controls autoPlay ref={partnerRef} />
        </LeftRow>
        <RightRow>
            <div className="ui inverted segment" id="player" />
           
            <div className="ui inverted segment" style={{backgroundColor:"black"}}>
            <Input type="text" placeholder=
            "video link" value={videoID} onChange={e=>setVideoID(e.target.value)}></Input>
            <button className="ui inverted orange button" onClick={loadVideo}>Load Video</button></div>
           
           
            
        </RightRow>
    </Container> */}

