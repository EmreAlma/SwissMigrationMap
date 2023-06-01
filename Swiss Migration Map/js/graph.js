function dataGraph(dataObject) {
  // Simon: radial is the id of our div
  d3.select("#radial").select("svg").remove();
  //Simon if we have no cantons-data, remove old graph and end function
  if (!dataObject) {
    return;
  }

  // Simon: currently we have an object {"alter 1": 10, "alter 2": 1, ...}
  // we transform this to an array of objects, with a label and a value
  // log the substeps (console.log(Object.keys(dataObject)), ...) to understand this better
  const ageGroups = Object.keys(dataObject)
    .filter((el) => el !== "Citizenship")
    .map((key) => {
      return {
        label: key,
        value: dataObject[key],
      };
    });
  const margin = { top: 10, right: 0, bottom: 0, left: 0 },
    width = 300 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom,
    innerRadius = 90,
    outerRadius = Math.min(width, height) / 2;

  // Simon: radial is the id of our div
  const svg = d3
    .select("#radial")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr(
      "transform",
      `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`
    );

  // Simon: adapt syntax to d3 v7
  const x = d3
    .scaleBand()
    .range([0, 2 * Math.PI])
    .align(0)
    // Simon: domain is all our labels
    .domain(ageGroups.map((d) => d.label));

  const y = d3
    .scaleRadial()
    .range([innerRadius, outerRadius])
    // domain is 0 to max of our values
    .domain([0, d3.max(ageGroups, (d) => d.value)]);

  svg
    .append("g")
    .selectAll("path")
    .data(ageGroups)
    .join("path")
    .attr("fill", "#447B9D")
    .attr(
      "d",
      d3
        .arc()
        .innerRadius(innerRadius)
        .outerRadius(function (d) {
          return y(d.value);
        })
        .startAngle(function (d) {
          return x(d.label);
        })
        .endAngle(function (d) {
          return x(d.label) + x.bandwidth();
        })
        .padAngle(0.01)
        .padRadius(innerRadius)
    );

  const labels = svg
    .append("g")
    .selectAll("g")
    // Simon: provide our age groups
    .data(ageGroups)
    .join("g")
    .attr("text-anchor", function (d) {
      return (x(d.label) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) <
        Math.PI
        ? "end"
        : "start";
    })
    .attr("transform", function (d) {
      return (
        "rotate(" +
        (((x(d.label) + x.bandwidth() / 2) * 180) / Math.PI - 90) +
        ")" +
        "translate(" +
        (y(d.value) + 10) +
        ",0)"
      );
    });

  labels
    .append("text")
    .text(function (d) {
      return d.label;
    })
    .attr("transform", function (d) {
      return (x(d.label) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) <
        Math.PI
        ? "rotate(180)"
        : "rotate(0)";
    })
    .style("font-size", "11px")
    .style("fill", "#fff") 
    .attr("alignment-baseline", "middle");
}

d3.csv("/migration_data/migration_2021.csv").then(function (data) {
  var countryData = data.filter(function (d) {
    return d.name === "Switzerland";
  })[0];

  dataGraph(data);
});
