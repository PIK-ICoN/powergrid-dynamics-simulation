/* globals d3 */

// initialize parallel job
var simWorker = new Worker('simulator/simulation.js');

// ###############################################################################################################
// setup svg container and background

// set background



var margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20
};

var format= d3.format(",.2f");
var ratio = 622/879;
var height = this.innerHeight*0.75;
var imgUrl = "simulator/northern_grid/northern_landmass.svg";

// network container
d3.select("#centrepiece").selectAll("p").remove();
var svg = d3
  .select("#centrepiece")
  .append("svg")
  .attr("viewBox", "0 0 " + height * ratio + " " + height)
  .attr("preserveAspectRatio", "xMidYMid meet")
  .attr("width", height * ratio)
  .attr("height", height);


// background image
svg.append("svg:image")
  .attr("xlink:href", imgUrl)
  .attr("x", margin.left)
  .attr("y", margin.top)
  .attr("width", height * ratio- margin.right)
  .attr("height", height - margin.bottom);

// scale max/min values for northern grid

var xScale = d3.scaleLinear()
  .domain([498.0, 2774.0])
  .range([margin.left * 1.2, (margin.left + height * ratio- margin.right)*0.9]);

var yScale = d3.scaleLinear()
  .domain([0, 3395.0])
  .range([margin.top*2.4, (margin.top + height - margin.bottom)*0.98]);

// ###############################################################################################################
// colors

var offset_color_red_blue = d3
  .scalePow()
  .exponent(0.3)
  .domain([-Math.PI, -Math.PI/3*2, -Math.PI/3, 0, Math.PI/3, Math.PI/3*2, Math.PI])
  .clamp(true)
  .range(["#009fda", "#81bee7", "#c3def3", "white", "#ffcab5", "#ff956e", "#f25b28"]);
var frequency_color = d3
  .scaleLinear()
  .domain([40, 45, 47.67, 49, 49.67, 50, 50.33, 51, 52.33, 55, 60])
  .clamp(true)
  .range(["#009fda", "#61b1e2", "#8fc4e9", "#b7d8f1", "#dbebf8", "#ffffff", "#ffdfd2", "#ffc0a6", "#ff9f7c", "#fc7f52", "#f25b28"]);
// Intermediate steps generated in Lab model with http://davidjohnstone.net/pages/lch-lab-colour-gradient-picker

var offset_color_rainbow = d3
  .scaleSequential(d3.interpolateRainbow)
  .domain([-Math.PI, Math.PI])
  .clamp(true);

var rainbow = false;
var offset_color = offset_color_red_blue;
var animation_color_data = () => 0;

function create_color_bar(title, color_scale, steps, labels, offset) {
  offset = offset || 0;
  var w = 140 / steps.length;

  var colorbar = svg.append("g")
    .attr("class", "colorbar")
    .attr("width", steps.length * w)
    .attr("height", 10)
    .attr("transform", "translate(" + (margin.left + 20) + "," +  (margin.top + 10 + offset)  + ")")
    .classed("option-selectable", true);

  colorbar.append("rect")
    .attr("x", -17)
    .attr("y", -27)
    .attr("width", 182)
    .attr("height", 59)
    .attr("rx", 5)
    .attr("ry", 5)
    .classed("option-selection-indicator", true);

  var patches = colorbar.append("g")
    .selectAll("rect")
    .data(steps)
    .enter()
    .append("rect");

  var ticks = colorbar.selectAll("text")
    .data(labels)
    .enter()
    .append("text");

  patches
    .attr("x", function(d, i) { return i*w; })
    .attr("y", 0)
    .attr("width", w )
    .attr("height", 10)
    .style("stroke", "black")
    .style("stroke-width", "1px")
    .style("fill", color_scale);

  ticks
    .attr("x", function(d, i) { return (0.5 + i) * w; })
    .attr("y", 25)
    .style("text-anchor", "middle")
    .text(function(d) { return d; });

  colorbar.append("text").attr("x", 0).attr("y", -10).text(title);

  return {
    container: colorbar,
    set_color_scale: function (new_color_scale) {
      patches.style("fill", new_color_scale);
    },
    set_selected: function (selected) {
      colorbar.classed("option-selected", selected);
    }
  };
}

var offset_color_bar = create_color_bar(
  "relative clock position",
  offset_color,
  [-Math.PI, -Math.PI/3*2, -Math.PI/3, 0, Math.PI/3, Math.PI/3*2, Math.PI],
  ["behind", "", "", "close", "", "", "advance"]
);
offset_color_bar.container.on('dblclick', toggleColor);

var frequency_color_bar = create_color_bar(
  "relative clock frequency",
  frequency_color,
  [40, 48, 50, 52, 60],
  ["40 Hz", "", "50 Hz", "", "60 Hz"],
  65
);

selectColorIndicator('offset');

offset_color_bar.container.on('click', () => selectColorIndicator('offset'));
frequency_color_bar.container.on('click', () => selectColorIndicator('frequency'));

// ###############################################################################################################
// add netmeter

var netmeter = (function(height, ratio, margin) {
  var _width = 200;
  var _height = 70;

  var container = svg.append("g")
    .attr("class", "net-meter")
    .attr("width", _width)
    .attr("height", _height)
    .attr("transform", "translate("
      + (margin.left + height * ratio- margin.right - 220) + ","
      + (margin.top + height - margin.bottom - 100)
      + ")");

  /** background */
  container.append("rect")
    .attr("width", _width)
    .attr("height", _height)
    .style("fill", "#dadfee");

  var axis = container.append("g")
    .attr('transform', 'translate(0, ' + _height + ')');

  var path = container.append("path")
    .attr("stroke", "black")
    .attr("stroke-width", "2px")
    .attr("fill", "none");


  /** normal frequency */
  container.append("line")
    .style("stroke", "grey")
    .style("stroke-width", "4px")
    .attr("x1", _width/2)
    .attr("y1", _height)
    .attr("x2", _width/2)
    .attr("y2", 0);

  var neg = container.append("line")
    .attr("stroke", "red")
    .attr("stroke-width", "1px")
    .attr("x1", _width/2)
    .attr("y1", _height)
    .attr("x2", _width/2)
    .attr("y2", 0);

  var pos = container.append("line")
    .attr("stroke", "red")
    .attr("stroke-width", "1x")
    .attr("x1", _width/2)
    .attr("y1", _height)
    .attr("x2", _width/2)
    .attr("y2", 0);

  var label = container.append("text")
    .attr("x", _width/2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .text("Average: 50 Hz");

  var label_bottom = container.append("text")
    .attr("x", _width/2)
    .attr("y", _height + 35)
    .attr("text-anchor", "middle")
    .text("Min: 50 Hz, Max: 50 Hz");

  var pointer = container.append("line")
    .style("stroke", "black")
    .style("stroke-width", "2px")
    .attr("x1", _width/2)
    .attr("y1", _height)
    .attr("x2", _width/2)
    .attr("y2", 0);

  /** From https://bl.ocks.org/mbostock/4341954 */

  var kernelDensityEstimator = function(kernel, X) {
    return function(V) {
      return X.map(function(x) {
        return [x, d3.mean(V, function(v) { return kernel(x - v); })];
      });
    };
  };

  var kernelEpanechnikov = function(k) {
    return function(v) {
      return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
  };

  return {
    axis: axis,
    neg: neg,
    pos: pos,
    label: label,
    label_bottom: label_bottom,
    pointer: pointer,
    path: path,
    kde: kernelDensityEstimator,
    kernel: kernelEpanechnikov
  };
})(height, ratio, margin);

// ###############################################################################################################
// fisheye distortion

var enable_fisheye = false;

(function() {
  d3.fisheye = {
    scale: function(scaleType) {
      return d3_fisheye_scale(scaleType(), 3, 0);
    },
    circular: function() {
      var radius = 200,
          distortion = 2,
          k0,
          k1,
          focus = [0, 0];

      function fisheye(d) {
        var dx = d.x - focus[0],
            dy = d.y - focus[1],
            dd = Math.sqrt(dx * dx + dy * dy);
        if (!dd || dd >= radius) { return {x: d.x, y: d.y, z: 1}; }
        var k = k0 * (1 - Math.exp(-dd * k1)) / dd * 0.75 + 0.25;
        return {x: focus[0] + dx * k, y: focus[1] + dy * k, z: Math.min(k, 10)};
      }

      function rescale() {
        k0 = Math.exp(distortion);
        k0 = k0 / (k0 - 1) * radius;
        k1 = distortion / radius;
        return fisheye;
      }

      fisheye.radius = function(_) {
        if (!arguments.length) { return radius; }
        radius = +_;
        return rescale();
      };

      fisheye.distortion = function(_) {
        if (!arguments.length) { return distortion; }
        distortion = +_;
        return rescale();
      };

      fisheye.focus = function(_) {
        if (!arguments.length) { return focus; }
        focus = _;
        return fisheye;
      };

      return rescale();
    }
  };

  function d3_fisheye_scale(scale, d, a) {

    function fisheye(_) {
      var x = scale(_),
          left = x < a,
          range = d3.extent(scale.range()),
          min = range[0],
          max = range[1],
          m = left ? a - min : max - a;
      if (m == 0) { m = max - min; }
      return (left ? -1 : 1) * m * (d + 1) / (d + (m / Math.abs(x - a))) + a;
    }

    fisheye.distortion = function(_) {
      if (!arguments.length) { return d; }
      d = +_;
      return fisheye;
    };

    fisheye.focus = function(_) {
      if (!arguments.length) { return a; }
      a = +_;
      return fisheye;
    };

    fisheye.copy = function() {
      return d3_fisheye_scale(scale.copy(), d, a);
    };

    fisheye.nice = scale.nice;
    fisheye.ticks = scale.ticks;
    fisheye.tickFormat = scale.tickFormat;
    return d3.rebind(fisheye, scale, "domain", "range");
  }
})();

var fisheye = d3.fisheye.circular().radius(200);

// ###############################################################################################################
// system setup

// dynamical variables
var frequency;
var avg = 0;
var phase;
var index;
var x;
var y;

var circleid = null;
var graph;

// parameters
var base_frequency = 8.0;
var	damp_modifier = 1.0;

var pert = {x: 0.1 * Math.PI, y: 1};

// load the network and perform simulation
d3.json("simulator/northern_grid/northern.json", function(e, d) {simulate_graph(d);});

// ###############################################################################################################

function simulate_graph(graph_loaded){

  graph = graph_loaded;

  index = {};
  x = {};
  y = {};
  graph.nodes.forEach(function(node, i) {index[node.id] = i; x[i] = xScale(node.x); y[i] = yScale(node.y);});


  // create svg groups with node and link layouts
  var linkGroup = svg.append("g")
    .attr("class", "links")
    .style("stroke", "black")
    .style("stroke-width", "5px");


  var link = linkGroup.selectAll("line")
    .data(graph.links)
    .enter()
    .append("line");

  link
    .attr("x1", function(d) { return x[index[d.source]]; })
    .attr("y1", function(d) { return y[index[d.source]]; })
    .attr("x2", function(d) { return x[index[d.target]]; })
    .attr("y2", function(d) { return y[index[d.target]]; });

  var nodeGroup = svg.append("g")
    .attr("class", "nodes")
    .attr("r", 20)
    .style("fill", "black")
    .style("stroke", "#686c70")
    .style("stroke-width", "1px")
    .style("cursor", "pointer");

  var node = nodeGroup.selectAll("circle")
    .data(graph.nodes)
    .enter()
    .append("circle");

  node
    .attr("cx", function(d) { return x[index[d.id]]; })
    .attr("cy", function(d) { return y[index[d.id]]; });

  node.on("click", clicked);


  // send data and start sim
  resetNetwork();
  startSim();

  var radius = height / 150;

  // recieve data
  simWorker.onmessage = e => {
    frequency = e.data.frequency;
    phase = e.data.phase;

    avg = d3.mean(frequency);

    var offset = 50.0 - base_frequency;

    node
      .style("fill", animation_color_data)
      .attr("r", function(d) { return d.id == circleid ? 2*radius : radius; });

    link
      .style("stroke-width", function(d) { return 10 * Math.log(1.05 + Math.abs(Math.sin(phase[index[d.source]] - phase[index[d.target]]))) + "px"; })
      .classed("transfer", function(d) { return phase[index[d.target]] > phase[index[d.source]]; })
      .classed("transfer-inverse", function(d) { return phase[index[d.target]] < phase[index[d.source]]; });


    var meterScale = d3.scaleLinear()
      .clamp(true)
      .domain([-10.0 + base_frequency,  base_frequency, 10.0 + base_frequency])
      .range([0, 100, 200]);

    var meterRange = d3.scaleLinear()
      .domain([0, 0.8])
      .range([0, 70]);

    netmeter.axis.call(
      d3.axisBottom()
        .scale(
          d3.scaleLinear()
            .domain([40, 60])
            .range([0, 200])
        )
        .ticks(9)
    );

    var meterLine = d3.line()
      .curve(d3.curveBasis)
      .x(function(d) { return meterScale(d[0]); })
      .y(function(d) { return 70 - meterRange(d[1]); });

    var density = netmeter.kde(netmeter.kernel(1), meterScale.ticks(1000))(frequency);

    netmeter.path
      .datum(density)
      .attr("d", meterLine);

    var markers = {
      min: meterScale(d3.min(frequency)),
      avg: meterScale(avg),
      max: meterScale(d3.max(frequency))
    };

    netmeter.pointer
      .attr("x1", markers.avg)
      .attr("x2", markers.avg);

    netmeter.neg
      .attr("x1", markers.min)
      .attr("x2", markers.min);

    netmeter.pos
      .attr("x1", markers.max)
      .attr("x2", markers.max);

    netmeter.label.text("Average: " + format(offset + avg) + " Hz");
    netmeter.label_bottom.text("Min: " + format(offset + d3.min(frequency)) + " Hz, Max: " + format(offset + d3.max(frequency)) + " Hz");


    if (enable_fisheye){
      svg.on("mousemove", function() {
          fisheye.focus(d3.mouse(this));

          node.each(function(d) { d.fisheye = fisheye({"x": x[index[d.id]], "y": y[index[d.id]]}); })
            .attr("cx", function(d) { return  d.fisheye.x; })
            .attr("cy", function(d) { return  d.fisheye.y; })
            .attr("r", function(d) { return  d.fisheye.z * 4.5; });

          link
            .attr("x1", function(d) { return fisheye({"x": x[index[d.source]], "y": y[index[d.source]]}).x; })
            .attr("y1", function(d) { return fisheye({"x": x[index[d.source]], "y": y[index[d.source]]}).y; })
            .attr("x2", function(d) { return fisheye({"x": x[index[d.target]], "y": y[index[d.target]]}).x; })
            .attr("y2", function(d) { return fisheye({"x": x[index[d.target]], "y": y[index[d.target]]}).y; });
      });
    }

  };

  svg.dispatch('graphReady');
}



// ###############################################################################################################
// Making the inputs do stuff

d3.select("#base_frequency").on("input", function() {
	base_frequency = 50.0 - +this.value;
	setParameters();
});

d3.select("#damp_modifier").on("input", function() {
	damp_modifier = +this.value;
	setParameters();
});

d3.select("#xpert_val").on("input", function() {
	pert.x = +this.value * Math.PI;
});

d3.select("#ypert_val").on("input", function() {
	pert.y = +this.value;
});

// Utility function to reset the Network

function resetNetwork() {
  //damp_modifier = 1.
  var data = {
    m_type: "network",
    graph: graph,
    base_frequency: base_frequency,
    damp_modifier: damp_modifier,
  };

  // send data
  simWorker.postMessage(data);

}


function setParameters() {
  var data = {
    m_type: "parameters",
    base_frequency: base_frequency,
    damp_modifier: damp_modifier,
  };
  // send data
  simWorker.postMessage(data);

}


function clicked(d) {
  var data = {
    m_type: 'perturbation',
    node_id: d.id,
    x: pert.x,
    y: pert.y
  };

  simWorker.postMessage(data);
  svg.dispatch('nodePerturbed', {detail: {nid: d.id}});
}

function startSim() {
  var data = {m_type: 'sim_on'};
  simWorker.postMessage(data);
}

function randomState() {
  var data = {m_type: 'random',
          x: pert.x,
          y: pert.y};
  simWorker.postMessage(data);
}

function stopSim() {
  var data = {m_type: 'sim_off'};
  simWorker.postMessage(data);
}


//special perturbations

var nids = [87, 32, 35, 230];

var perts = {
  "strong": {
    x: 0.1 * Math.PI,
    y: 10
  },
  "weak": {
    x: 0.1 * Math.PI,
    y: 0.5
  }
};


function perturb(n, p) {
  var data = {m_type: 'perturbation',
          node_id: nids[n],
          x: perts[p].x,
          y: perts[p].y};
  simWorker.postMessage(data);
  svg.dispatch('nodePerturbed', {detail: {nid: nids[n]}});
}


function over(n) {
  circleid = nids[n];
  // Cause a redraw
  simWorker.postMessage({m_type: 'bounce'});
}

function out() {
  circleid = null;
  // Cause a redraw
  simWorker.postMessage({m_type: 'bounce'});
}


function stableSystem() {
  damp_modifier = 20.0;
  setParameters();
}


function weakSystem() {
  damp_modifier = 0.2;
  setParameters();
}


function toggleFisheye() {
  if (enable_fisheye) {
    enable_fisheye = false;
    fisheye = null;
  }
  else
  {
    enable_fisheye = true;
    fisheye = d3.fisheye.circular().radius(200);
  }
}

function selectColorIndicator(indicator) {
  offset_color_bar.set_selected(indicator == 'offset');
  frequency_color_bar.set_selected(indicator == 'frequency');

  if (indicator == 'offset') {
    animation_color_data = function (d) {
      return offset_color((phase[index[d.id]] + Math.PI) % ( 2*Math.PI) - Math.PI);
    };
  } else {
    animation_color_data = function (d) {
      return frequency_color(frequency[index[d.id]] + 50.0 - base_frequency);
    };
  }
}

function toggleColor() {
	if (rainbow) {
    offset_color = offset_color_red_blue;
	} else {
    offset_color = offset_color_rainbow;
	}
  offset_color_bar.set_color_scale(offset_color);
  selectColorIndicator('offset');
  rainbow = !rainbow;
}

