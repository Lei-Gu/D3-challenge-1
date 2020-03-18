// SVG contained size
var svgWidth = Math.min(1140, window.innerWidth - 200);
var svgHeight = 500;

var margin = {
    top: 20,
    right: 40,
    bottom: 100,
    left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
var svg = d3
    .select("#scatter")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "poverty";
var chosenYAxis = "healthcare";

// function used for updating x or y scale var upon click on axis label
function axisScale(data, chosenAxis) {
    let scaleRange;
    if (chosenAxis === "poverty"|chosenAxis === "age"|chosenAxis === "income") {
        // x-axis
        scaleRange = [0, width];
    } else {
        // y-axis
        scaleRange = [height, 0];
    };

    return d3.scaleLinear()
        .domain([d3.min(data, d => d[chosenAxis]) * 0.8,
            d3.max(data, d => d[chosenAxis]) * 1.2
        ])
        .range(scaleRange);
};

// function used for updating xAxis var upon click on axis label
function renderXAxes(newXScale, xAxis) {
  let bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

// function used for updating yAxis var upon click on axis label
function renderYAxes(newYScale, yAxis) {
    let leftAxis = d3.axisLeft(newYScale);

    yAxis.transition()
      .duration(1000)
      .call(leftAxis);

    return yAxis;
  }

// function to add/update state texts/labels
function updateStateTexts(dataLabel, axis, newScale, chosenAxis) {
    dataLabel.transition()
        .duration(1000)
        .attr(axis, d => newScale(d[chosenAxis]));
    return dataLabel;
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, axis, newScale, chosenAxis) {
    circlesGroup.transition()
        .duration(1000)
        .attr(axis, d => newScale(d[chosenAxis]));
    return circlesGroup;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {

    var xlabel;
    var ylabel;
    var xNumFormat;
    var xlabelSuffix;

    switch(chosenXAxis) {
        case "poverty":
            xlabel = "Poverty:";
            xNumFormat = d3.format(".1f");
            xlabelSuffix = "%";
            break;
        case "age":
            xlabel = "Age:";
            xNumFormat = d3.format(".1f");
            xlabelSuffix = "";
            break;
        case "income":
            xlabel = "Household Income:";
            xNumFormat = d3.format(",");
            xlabelSuffix = "";
    };

    switch(chosenYAxis) {
        case "healthcare":
            ylabel = "Lacks Healthcare:";
            break;
        case "smokes":
            ylabel = "Smokes:";
            break;
        case "obesity":
            ylabel = "Obesity:";
    };

    var toolTip = d3.tip()
        .attr("class", "d3-tip")
        .offset([80, -60])
        .html(function(d) {
            return (`${d.state}<br>${xlabel} ${xNumFormat(d[chosenXAxis])}${xlabelSuffix}<br>${ylabel} ${d[chosenYAxis]}%`);
    });

    circlesGroup.call(toolTip);

    circlesGroup
        .on("mouseover", data => toolTip.show(data))
        .on("mouseout", data => toolTip.hide(data));

    return circlesGroup;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("./assets/data/data.csv").then(function(data, err) {
    if (err) throw err;

    // parse data
    data.forEach(function(d) {
        d.poverty = +d.poverty;
        d.age = +d.age;
        d.income = +d.income;
        d.healthcare = +d.healthcare;
        d.obesity = +d.obesity;
        d.smokes = +d.smokes;
    });

    // LinearScale function
    var xLinearScale = axisScale(data, chosenXAxis);
    var yLinearScale = axisScale(data, chosenYAxis);

    // Create initial axis functions
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    // append x axis
    var xAxis = chartGroup.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(bottomAxis);

    // append y axis
    var yAxis = chartGroup.append("g")
        .call(leftAxis);

    // append initial circles
    var circlesGroup = chartGroup.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "stateCircle")
        .attr("cx", d => xLinearScale(d[chosenXAxis]))
        .attr("cy", d => yLinearScale(d[chosenYAxis]))
        .attr("r", 10);

    // add data labels
    var stateLabel = chartGroup.append("g")
        .selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "stateText")
        .attr("x", d => xLinearScale(d[chosenXAxis]))
        .attr("y", d => yLinearScale(d[chosenYAxis]))
        .attr("dy", ".35em")
        // .attr("font-size", "10px")
        .text(d => d.abbr);

    // Create group for x-axis labels
    var xlabelsGroup = chartGroup.append("g")
        .attr("transform", `translate(${width / 2}, ${height + 20})`);

    var povertyLabel = xlabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 20)
        .attr("value", "poverty") // value to grab for event listener
        .classed("active", true)
        .text("In Poverty (%)");

    var ageLabel = xlabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 40)
        .attr("value", "age") // value to grab for event listener
        .classed("inactive", true)
        .text("Age (Median)");

    var incomeLabel = xlabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 60)
        .attr("value", "income") // value to grab for event listener
        .classed("inactive", true)
        .text("Household Income (Median)");

    // Create group for y-axis labels
    var ylabelsGroup = chartGroup.append("g")
        .attr("transform", "rotate(-90)");

    var healthcareLabel = ylabelsGroup.append("text")
        .attr("y", 0 - margin.left + 60)
        .attr("x", 0 - (height / 2))
        .attr("value", "healthcare")
        .classed("active", true)
        .text("Lacks Healthcare (%)");

    var smokesLabel = ylabelsGroup.append("text")
        .attr("y", 0 - margin.left + 40)
        .attr("x", 0 - (height / 2))
        .attr("value", "smokes")
        .classed("inactive", true)
        .text("Smokes (%)");

    var obesityLabel = ylabelsGroup.append("text")
        .attr("y", 0 - margin.left + 20)
        .attr("x", 0 - (height / 2))
        .attr("value", "obesity")
        .classed("inactive", true)
        .text("Obese (%)");

    // updateToolTip function above csv import
    var circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

    // x axis labels event listener
    xlabelsGroup.selectAll("text").on("click", function() {
        // get value of selection
        var value = d3.select(this).attr("value");

        // update x axis and scale with transition
        if (value !== chosenXAxis) {
            chosenXAxis = value;          // replaces chosenXAxis with value
            xLinearScale = axisScale(data, chosenXAxis);
            xAxis = renderXAxes(xLinearScale, xAxis);

            // updates circles with new x values
            circlesGroup = renderCircles(circlesGroup, "cx", xLinearScale, chosenXAxis);

            // update state labels
            stateLabel =  updateStateTexts(stateLabel, "x", xLinearScale, chosenXAxis);

            // updates tooltips with new info
            circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

            // changes classes to change bold text
            switch (chosenXAxis) {
                case "poverty":
                    povertyLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    ageLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    incomeLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    break;
                case "age":
                    povertyLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    ageLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    incomeLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    break;
                case "income":
                    povertyLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    ageLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    incomeLabel
                        .classed("active", true)
                        .classed("inactive", false);
                }
        }
    });

    // y axis labels event listener
    ylabelsGroup.selectAll("text").on("click", function() {
        // get value of selection
        var value = d3.select(this).attr("value");

        // update y axis and scale with transition
        if (value !== chosenYAxis) {
            chosenYAxis = value;          // replaces chosenXAxis with value
            yLinearScale = axisScale(data, chosenYAxis);
            yAxis = renderYAxes(yLinearScale, yAxis);

            // updates circles with new x values
            circlesGroup = renderCircles(circlesGroup, "cy", yLinearScale, chosenYAxis);

            // update state labels
            stateLabel =  updateStateTexts(stateLabel, "y", yLinearScale, chosenYAxis);

            // updates tooltips with new info
            circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

            // changes classes to change bold text
            switch (chosenYAxis) {
                case "healthcare":
                    healthcareLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    smokesLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    obesityLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    break;
                case "smokes":
                    healthcareLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    smokesLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    obesityLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    break;
                case "obesity":
                    healthcareLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    smokesLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    obesityLabel
                        .classed("active", true)
                        .classed("inactive", false);
                }
        }
    });

}).catch(function(error) {
    console.log(error);
});
