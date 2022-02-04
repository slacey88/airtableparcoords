import { useD3, d3 } from './useD3';
import React from 'react'; 
import renderQueue from './renderQueue'; 

function Chart({ data, width }) { 
  
  const keys = ["economy (mpg)", "cylinders", "displacement (cc)", "power (hp)", "weight (lb)", "0-60 mph (s)", "year"]; 

  const block_height = 85; 
  const height = keys.length * block_height; 
  const margin = { top: 40, right: 20, bottom: 30, left: 20 };

  const keyz = "economy (mpg)";

  const ref = useD3(
    (chart) => {
       
      const colors = d3.interpolateBrBG; 

      const x = new Map(Array.from(keys, key => [key, d3.scaleLinear(d3.extent(data, d => d[key]), [margin.left, width - margin.right])]))
  
      const y = d3.scalePoint(keys, [margin.top, height - margin.bottom])
      const z = d3.scaleSequential(x.get(keyz).domain().reverse(), colors)

      const svg = chart.select('svg');
      const canvas = chart.select("canvas") 
                    .attr("width", width)
                    .attr("height", height) 
                    .node()
                    .getContext('2d');   

      svg.selectAll("g").remove();

      const line = d3.line()
                .defined(([, value]) => value != null)
                .x(([key, value]) => x.get(key)(value))
                .y(([key]) => y(key))

      const path = svg.append("g")
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.4)
      .selectAll("path")
      .data(data.slice().sort((a, b) => d3.ascending(a[keyz], b[keyz])))
      .join("path")
        .attr("stroke", d => z(d[keyz]))
        .attr("d", d => line(d3.cross(keys, [d], (key, d) => [key, d[key]])));

      svg.append("g")
        .selectAll("g")
        .data(keys)
        .join("g")
          .attr("transform", d => `translate(0,${y(d)})`)
          .each(function(d) { d3.select(this).call(d3.axisBottom(x.get(d)).ticks(5)); })
          .call(g => g.append("text")
            .attr("x", margin.left)
            .attr("y", -15) 
            .attr("font-size", 12)
            .attr("text-anchor", "start")
            .attr("fill", "currentColor")
            .text(d => d)) 
          
          //.call(brush);    
 
      canvas.clearRect(0, 0, width, height); 
             
      

      const setOpacity = (hex, alpha) => `rgba${hex?.substring(hex?.indexOf('('), hex?.indexOf(')'))}, ${alpha})`;

      // Callback to render each row of data
      var row = (d) => { 
      
        canvas.globalCompositeOperation = 'darken'; 
        canvas.lineWidth = 2;
        
        canvas.strokeStyle = setOpacity(z(d['year']), 1.0) 
        canvas.beginPath();
 
        line(d3.cross(keys.map((d) => d), [d], (key, d) => [key, d[key]]));

       // .attr("stroke", d => z(d[keyz]))
       // line(d3.cross(keys, [d], (key, d) => [key, d[key]]));
     
        canvas.stroke();
      }
              
      // Progressive render of the lines on canvas
      var render = renderQueue(row).rate(100);      
      render(data);   

    },
    [data.length, width]
  );

  return (
    <div id="chart" ref={ref}> 
      <canvas
        style={{position:'absolute'}}
      />
      <svg 
        style={{
          height: height,
          width: "100%",
          marginRight: "0px",
          marginLeft: "0px", 
          position:'absolute'
        }}
      >
        <g className="plot-area" />
        <g className="x-axis" />
        <g className="y-axis" />
      </svg> 
    </div>
  );
}

export default Chart;