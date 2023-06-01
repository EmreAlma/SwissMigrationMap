var newSpan = null;
let selectedColorization;
let selectedCountry
function yearFuncForWorldMap(year) {
    d3.json("/lib/world.geo.json").then(function (geojson_world) {
        Promise.all([
            d3.csv("/migration_data/migration_" + year + ".csv"),
            d3.csv("/age-class/" + year + "_graph_data.csv")]
        ).then(function ([migrationData, grap]) {
                var world = topojson.feature(
                    geojson_world,
                    geojson_world.objects.countries
                );

                world.features = world.features.filter(function (d) {
                    return d.properties.name !== "Antarctica";
                });

                migrationData.forEach(function (row) {
                    world.features.some(function (country) {
                        if (country.properties.name === row.name) {
                            for (var k in row) {
                                country.properties[k] = row[k];
                            }
                            return true;
                        }
                    });
                });

                var svg = d3.select("svg");

                var width = parseInt(d3.select("svg").style("width"));
                var height = parseInt(d3.select("svg").style("height"));

                var projection = d3.geoMercator().translate([width / 2, height / 2]);

                var path = d3.geoPath().projection(projection);

                var countries = svg
                    .select("#main")
                    .selectAll("path")
                    .data(world.features)
                    .enter()
                    .append("path")
                    .attr("class", "country")
                    .attr("d", path)
                    .style("stroke", "grey")
                    .attr("stroke-width", 1);

                console.log("Step 5 - Draw the countries", countries);

                countries
                    .on("mouseover", function (event, d) {
                        d3.select(this).attr("stroke-width", 3);

                        var countrydata = {
                            name: d.properties.name,
                            population: d.properties.pop_est,
                            migration: d.properties.migration,
                        };

                        var html = "";

                        for (var k in countrydata) {
                            html +=
                                "<li><strong>" + k.toUpperCase() + "</strong> : " + countrydata[k] + "</li>";
                        }

                        d3.select("#info ul").html(html);


                        let dataOfGrap = grap.find(el => el.Citizenship === d.properties.name);
                        dataGraph(dataOfGrap, year);

                    })
                    .on("mouseout", function (d) {
                      //  d3.select("#info ul").html("");
                        d3.select(this).attr("stroke-width", 1);
                    });

                var zoom = d3
                    .zoom()
                    .scaleExtent([1, 10])
                    .on("zoom", function (event) {
                        // Simon adapt to syntax of v7
                        // https://observablehq.com/@d3/d3v6-migration-guide#events
                        d3.select("#main").attr("transform", () =>
                                "translate(" +
                                event.transform.x +
                                "," +
                                event.transform.y +
                                ") scale(" +
                                event.transform.k +
                                ")"
                    )});

                svg.call(zoom);
                d3.select("#zoom-in").on("click", function () {
                    zoom.scaleBy(svg.transition().duration(400), 1.2);
                  });
                  
                  d3.select("#zoom-out").on("click", function () {
                    zoom.scaleBy(svg.transition().duration(400), 0.8);
                  });
                var colorizations = [
                    {
                        label: "World Map",
                        colorize: function () {
                            var scale = d3.scaleOrdinal(d3.schemeCategory10);
                            d3.selectAll("path.country")
                                .transition()
                                .attr("fill", function (d) {
                                    return scale(d.properties.mapcolor13);
                                });
                        },
                    },
                    {
                        label: "Population",
                        colorize: function () {
                            // Simon adapt syntax to v7
                            var scale = d3.scaleLog()
                                .domain([
                                    100000,
                                    d3.max(world.features, function (d) {
                                        return d.properties.pop_est;
                                    }),
                                ])
                                .range(["#EEEEEE", "#0000ff"]);

                            d3.selectAll("path.country")
                                .transition()
                                .attr("fill", function (d) {
                                    return scale(d.properties.pop_est);
                                });
                        },
                    },
                    {
                        label: "migration",
                        colorize: function () {
                            // Simon adapt syntax to v7
                            var scale = d3.scaleLinear()
                                .domain(
                                    d3.extent(world.features, function (d) {
                                        return Math.max(d.properties.migration, 40);
                                    })
                                )
                                .range(["#ffffff", "#ff0000"]);

                            d3.selectAll("path.country")
                                .transition()
                                .attr("fill", function (d) {
                                    return scale(d.properties.migration);
                                });
                        },
                    },
                ];

                if (newSpan === null) {
                    newSpan = d3
                        .select("#selector")
                        .selectAll("span")
                        .data(colorizations)
                        .enter()
                        .append("div")
                        .attr("class", "mr-2")
                        .style("display", "inline-flex");

                    newSpan
                        .append("button")
                        .attr("class", "btn")
                        .text(function (d) {
                            return d.label;
                        })
                        // Simon adapt syntax to v7
                        .on("click", function (event, d) {
                            selectedColorization = d;
                            d.colorize();
                        });
                }

                if (!selectedColorization) {
                    selectedColorization = colorizations[0];
                }

                selectedColorization.colorize();

                d3.select("#selector input").property("checked", true);
            }
        );
    });
}