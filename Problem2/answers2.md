<h1>Problem 2 Questions</h1>
<h2>Q1: Data types of Wiki Table</h2>
<p>Data types include Year (as negative and positive ints),  population sizes estimated by different sources as both single and ranges of ints (comma delimited), string names of estimation sources, and year of estimation as int and int range.
	What's different?  Not all data is present, ie. estimation sources do not have estmations for every year listed, and vice versa. We are also presented with the problem of ranges of values, rather than a single defined value. 
</p>	
<h2>Q2: Select table info</h2>
<p>Select second row:  <code>$('.wikitable>tbody>tr:eq(2)')</code></p>
<p>Select all table rows:  <code>$('.wikitable>tbody>tr:not(:eq(0))')</code></p>


