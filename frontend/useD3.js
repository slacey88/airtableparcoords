import React from 'react'; 
const D3Node = require('d3-node')
const d3Node = new D3Node()    
const d3 = d3Node.d3;

const useD3 = (renderChartFn, dependencies) => {
    const ref = React.useRef();
 
    React.useEffect(() => {
        renderChartFn(d3.select(ref.current));
        return () => {};
      }, dependencies);
      
    return ref;
} 

export { useD3, d3 }