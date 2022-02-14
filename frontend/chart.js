import { useD3, d3 } from './useD3';
import React from 'react';  

// https://observablehq.com/@d3/brushable-parallel-coordinates

function Chart({ data, width, keys, blockHeight = 85, onFiltered }) { 
    
  const height = keys.length * blockHeight; 
  const margin = { top: 40, right: 20, bottom: 30, left: 20 }; 
  const keyz = keys[keys.length - 1];
  const brushHeight = blockHeight / 4;

  const ref = useD3(
    (chart) => {
       
      const colors = d3.interpolateBrBG; 

      const x = new Map(Array.from(keys, key => [key, d3.scaleLinear(d3.extent(data, d => d[key]), [margin.left, width - margin.right])]));  
      const y = d3.scalePoint(keys, [margin.top, height - margin.bottom]);
      const z = d3.scaleSequential(x.get(keyz).domain().reverse(), colors);

      const svg = chart.select('svg'); 

      svg.selectAll("g").remove();
      
      const line = d3.line()
        .defined(([, value]) => value != null)
        .x(([key, value]) => x.get(key)(value))
        .y(([key]) => y(key))

      const brush = d3.brushX()
        .extent([
          [margin.left, -(brushHeight)],
          [width - margin.right, brushHeight]
        ])
        .on("start brush end", brushed) 
 
      const path = svg.append("g")
          .attr("fill", "none")
          .attr("stroke-width", 2.0)
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
            .each(function(d) { d3.select(this).call(d3.axisBottom(x.get(d))); })
            .call(g => g.append("text")
              .attr("x", margin.left)
              .attr("y", -6)
              .attr("text-anchor", "start")
              .attr("fill", "currentColor")
              .attr("font-size", 12) 
              .text(d => d))
            .call(g => g.selectAll("text")
              .clone(true).lower()
              .attr("fill", "none")
              .attr("stroke-width", 5)
              .attr("stroke-linejoin", "round")
              .attr("stroke", "white"))
            .call(brush);
      
      const selections = new Map();  

      function brushed({selection}, key) {   
        // Issue getting selection here so parse the event manually
        var selection = d3.event.selection;   
        var selected_key = keys[key]; 

        if (selection === null) selections.delete(selected_key);
        else selections.set(selected_key, selection.map(x.get(selected_key).invert));
        const selected = [];
 
        // Repaint the selected lines
        path.each(function(d) {
          const active = Array.from(selections).every(([key, [min, max]]) => d[key] >= min && d[key] <= max);
          d3.select(this).style("stroke", active ? z(d[keyz]) : '#ddd');
          if (active) {
            d3.select(this).raise();
            selected.push(d);
          }
        }); 
 
        if (d3.event.type !== 'brush' && selected.length > 0) {
            onFiltered(selected); 
        } 
      }

      svg.property("value", data).node();
    },
    [data.length, width]
  );

  return (
    <div id="chart" ref={ref}>  
      <svg 
        style={{
          height: height,
          width: "100%",
          marginRight: "0px",
          marginLeft: "0px",  
        }}
      > 
      </svg> 
    </div>
  );
}

export default Chart;