<h1>Problem 2: Difference Graph</h1>

<p>I implemented the following additional features:</p>
<ul>
	<li>Zoom/Pan in X-axis or X- and Y-axes. Hold the ALT key to zoom only along the x-axis and to pan along this zoom setting. Otherwise, scroll/double-click and click/drag to zoom/pan in x- and y-directions. To reset, click the appropriate scale radio button.</li>
	<li>Toggle Sources to get better clarity of individual sources by clicking on the corresponding name/colour-box in the legend. To de-select or select all, simply click on the corresponding words.</li>
	<li>Linear or Log Scale. Log scale provided for easier viewing of the population vs. time graphs (such as the default). Log Scale only works on ALL DATA (consensus analysis) plotted on POPULATION VS TIME (divergence). </li>
	<li>Consensus plotted on Population vs Time, with the range above (in red) and below (in white) plotted underneath as an area.</li>
	<li>Estimation Divergence vs. Time Divergence plotted as area graphs above/below the consensus average. Divergence of different estimation agencies can be viewed by absolute value (# of persons) or by percent difference according to the Divergence Type selection, calculated as the absolute difference proportioned by the consensus value, and expressed as a percent.</li>
	<li>Consensus info on Mouseover appears in the upper left corner of the graph. The tip box, and the corresponding vertical line and circle indicates the year which the mouse is on as well as the consensus population. Minima and maxima are also given.</li>
</ul>

I chose to make the points smaller, and eliminate the interpolated points as they were obstructing the data. I also chose to elimminate lines and points on the area graphs as I felt that it was a more visually appealing, cleaner and easily comprehendable design, while still containing all the information. 

The toggle select of the different sources took a while to do, but I felt it was important as many of the estimations overlapped, and it was difficult to assess individual trends and discrepancies in aggregate. It's also fun to be able to interact and have the user explore the data through toggling, zooming and analyzing on their own.

I decided to have a static tool tip textbox with the vertical line and circle moving along with the mouse. This way, it is easier to read more information (without having to shift one's eyes constantly to adjust to a new spot), while scanning along the graph. I implement the vertical line which corresponds to the year of the datum featured and the circle which slid along the consensus x and y coordinates so that viewers would have an easier time navigating the graphs, especially with the area graphs. To find the data points, I used the d3.bisector function to more efficiently and dynamically search for the closest datum according to the mouse position.

If I could spend more time on this, I would try figuring out the bugs with the log scale for the area graphs, further develop zoom/pan ability/figure out a more elegant way to toggle X-only vs. XY zoom that doesn't give a null error, extend the tooltip data-tracking to all data sets, and fix the centering of the graph(?).