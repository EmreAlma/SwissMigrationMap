
var year;

function yearSelected(selectedYear) {
    year = selectedYear;
    d3.json("/lib/ch.json", handleGeoJson);
}

function handleGeoJson(err, geojson_switzerland) {
    if (err) return console.error(err);

    d3.csv(
        "/cantons-data/ch_cantons_" + year + ".csv",
        function (d) {
            for (var k in d) {
                if (k !== "canton") {
                    d[k] = +d[k];
                }
            }
            return d;
        },
        function (err, data) {
            if (err) return console.error(err);

            var switzerland = extractCantons(geojson_switzerland);

            combineData(switzerland, data);

            var svg = d3.select("svg");
            var width = parseInt(d3.select("svg").style("width"));
            var height = parseInt(d3.select("svg").style("height"));
            var path = d3.geo.path().projection(null);

            bindCantons(svg, switzerland, path);
            bindCantonLabels(svg, switzerland, path);
            createButtons(data);
            updateMap(data, "Sex - total");
            enableZoom(svg);
        }
    );
}

function extractCantons(geojson_switzerland) {
    return topojson.feature(
        geojson_switzerland,
        geojson_switzerland.objects.cantons
    );
}

function combineData(switzerland, data) {
    data.forEach(function (row) {
        switzerland.features.some(function (canton) {
            if (canton.properties.abbr === row.canton) {
                for (var k in row) {
                    canton.properties[k] = row[k];
                }
                return true;
            }
        });
    });
}

function bindCantons(svg, switzerland, path) {
    let mouseOver = function (d) {
        d3.selectAll(".cantons").transition().duration(200).style("opacity", 0.5);
        d3.select(this)
            .transition()
            .duration(200)
            .style("opacity", 1)
            .attr("stroke-width", 2)
            .style("stroke", "black");
    };

    let mouseLeave = function (d) {
        d3.selectAll(".cantons").transition().duration(200).style("opacity", 0.8);
        d3.select(this)
            .transition()
            .duration(200)
            .attr("stroke-width", 1)
            .style("stroke", "grey");
    };
    let infoBox = d3.select("#info-box"); // Select the info box element

    let mouseClick = function (d) {
        // Clear the info box
        infoBox.html("");
        // Populate the info box with cantons-data
        for (var key in d.properties) {
           delete d.properties["id"]
            if (key !== "abbr") {
                var row = infoBox.append("div").attr("class", "info-row");
                console.log(d.properties)
                row
                    .append("span")
                    .attr("class", "info-label")
                    .style("text-transform", "uppercase")
                    .text(key + ": ");

                row.append("span").attr("class", "info-value").text(d.properties[key]);
            }
        }
    };
    var cantons = svg
        .select("#main")
        .selectAll("path.canton")
        .data(switzerland.features)
        .enter()
        .append("path")
        .attr("class", "canton")
        .attr("d", path)
        .attr("stroke-width", 1)
        .style("stroke", "grey")
        .attr("cursor", "pointer")
        .on("mouseover", mouseOver)
        .on("mouseleave", mouseLeave)
        .on("click", mouseClick);
}
function bindCantonLabels(svg, switzerland, path) {
    svg
        .select("#main")
        .selectAll("text")
        .data(switzerland.features)
        .enter()
        .append("g")
        .attr("transform", function (d) {
            return "translate(" + path.centroid(d) + ")";
        })
        .append("text")
        .text(function (d) {
            return d.properties.abbr;
        });
}

function createButtons(data) {
    var buttonData = d3.keys(data[0]).slice(1); // Exclude the first key
    var buttons = d3
        .select("#selector")
        .selectAll("button")
        .data(buttonData)
        .enter()
        .append("button")
        .attr("class", "btn")
        
        .text(function (key) {

            return key;
        });

    buttons.on("click", function (key) {
        updateMap(data, key);
    });
}

function updateMap(data, key) {

    var scale = d3.scale
        .linear()
        .domain(
            d3.extent(data, function (d) {
                return d[key];
            })
        )
        .range([1, 0.4]);

    var hue = Math.random() * 360;

    d3.selectAll("path.canton")
        .transition()
        .attr("fill", function (d) {
            return d3.hsl(hue, 1, scale(d.properties[key]));
        });
}

function enableZoom(svg) {
    var zoom = d3.behavior
        .zoom()
        .scaleExtent([1, 10])
        .on("zoom", function () {
            d3.select("#main").attr({
                transform:
                    "translate(" +
                    d3.event.translate[0] +
                    "," +
                    d3.event.translate[1] +
                    ") scale(" +
                    d3.event.scale +
                    ")",
            });
        });

    svg.call(zoom);
  
}
