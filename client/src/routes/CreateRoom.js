import React from 'react';
import {v1 as uuid} from 'uuid';

const createRoom = (props) =>{
    function create()
    {
        const id = uuid();
        props.history.push(`/room/${id}`); 
    }
    return(
        
        <div className="d-flex justify-content-center mt-5" >
        
            
                
            <button style={{color:"black"}} className="ui red button" onClick={create}>Create room</button>
            
            
            
                
            </div>
            
            
        
    //  </div>
    );
}
export default createRoom;

{/* <div className="d-flex justify-content-center" style={{marginTop:"50%"}}>

</div> */}

