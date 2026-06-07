/**
 * US News & World Report 2026 rankings mapped by IPEDS unitid.
 * Source: Andrew G. Reiter dataset (andyreiter.com/datasets), US News 2026.
 * Covers Top-150 National Universities + ranked National Liberal Arts Colleges.
 * Military academies excluded. Tier-2/unranked schools omitted.
 */

export const USNEWS_RANKS: Record<number, number> = {
  // ── National Universities ──────────────────────────────────────────────
  186131 : 1, // Princeton University
  166683 : 2, // Massachusetts Institute of Technology
  166027 : 3, // Harvard University
  243744 : 4, // Stanford University
  130794 : 4, // Yale University
  144050 : 6, // University of Chicago
  198419 : 7, // Duke University
  162928 : 7, // Johns Hopkins University
  147767 : 7, // Northwestern University
  215062 : 7, // University of Pennsylvania
  110404 : 11, // California Institute of Technology
  190415 : 12, // Cornell University
  217156 : 13, // Brown University
  182670 : 13, // Dartmouth College
  190150 : 15, // Columbia University
  110635 : 15, // University of California-Berkeley
  110662 : 17, // University of California-Los Angeles
  227757 : 17, // Rice University
  221999 : 17, // Vanderbilt University
  152080 : 20, // University of Notre Dame
  211440 : 20, // Carnegie Mellon University
  170976 : 20, // University of Michigan-Ann Arbor
  179867 : 20, // Washington University in St. Louis
  139658 : 24, // Emory University
  131496 : 24, // Georgetown University
  234076 : 26, // University of Virginia
  199120 : 26, // University of North Carolina-Chapel Hill
  123961 : 28, // University of Southern California
  110680 : 29, // University of California-San Diego
  134130 : 30, // University of Florida
  228778 : 30, // University of Texas-Austin
  193900 : 32, // New York University
  139755 : 32, // Georgia Institute of Technology
  110644 : 32, // University of California-Davis
  110653 : 32, // University of California-Irvine
  145637 : 36, // University of Illinois-Urbana-Champaign
  164924 : 36, // Boston College
  168148 : 36, // Tufts University
  240444 : 36, // University of Wisconsin-Madison
  110705 : 40, // University of California-Santa Barbara
  204796 : 40, // Ohio State University-Columbus
  164988 : 42, // Boston University
  186380 : 42, // Rutgers University-New Brunswick
  163286 : 42, // University of Maryland-College Park
  236948 : 42, // University of Washington
  195030 : 46, // University of Rochester
  213543 : 46, // Lehigh University
  243780 : 46, // Purdue University
  139959 : 46, // University of Georgia
  167358 : 46, // Northeastern University
  199847 : 51, // Wake Forest University
  201645 : 51, // Case Western Reserve University
  228723 : 51, // Texas A&M University-College Station
  233921 : 51, // Virginia Polytechnic Institute and State University
  231624 : 51, // College of William and Mary
  134097 : 51, // Florida State University
  445188 : 57, // University of California-Merced
  216597 : 57, // Villanova University
  174066 : 59, // University of Minnesota
  196097 : 59, // Stony Brook University
  131469 : 59, // George Washington University
  214777 : 59, // Pennsylvania State University-University Park
  122931 : 59, // Santa Clara University
  199193 : 64, // North Carolina State University
  166629 : 64, // University of Massachusetts-Amherst
  171100 : 64, // Michigan State University
  135726 : 64, // University of Miami
  194824 : 64, // Rensselaer Polytechnic Institute
  165015 : 69, // Brandeis University
  160755 : 69, // Tulane University
  129020 : 69, // University of Connecticut
  215293 : 69, // University of Pittsburgh
  196079 : 73, // Binghamton University
  151351 : 73, // Indiana University-Bloomington
  196413 : 75, // Syracuse University
  196088 : 75, // University of Buffalo
  110671 : 75, // University of California-Riverside
  217882 : 75, // Clemson University
  186399 : 75, // Rutgers University-Newark
  126775 : 80, // Colorado School of Mines
  186867 : 80, // Stevens Institute of Technology
  185828 : 80, // New Jersey Institute of Technology
  212054 : 80, // Drexel University
  121150 : 84, // Pepperdine University
  145600 : 84, // University of Illinois-Chicago
  168421 : 84, // Worcester Polytechnic Institute
  197708 : 84, // Yeshiva University
  110714 : 88, // University of California-Santa Cruz
  131520 : 88, // Howard University
  239105 : 88, // Marquette University
  130943 : 88, // University of Delaware
  131159 : 88, // American University
  223232 : 88, // Baylor University
  195003 : 88, // Rochester Institute of Technology
  228246 : 88, // Southern Methodist University
  137351 : 88, // University of South Florida
  191241 : 97, // Fordham University
  133951 : 97, // Florida International University
  186371 : 97, // Rutgers University-Camden
  126614 : 97, // University of Colorado-Boulder
  228875 : 97, // Texas Christian University
  117946 : 102, // Loyola Marymount University
  235316 : 102, // Gonzaga University
  216339 : 102, // Temple University
  153658 : 102, // University of Iowa
  100858 : 102, // Auburn University
  179159 : 102, // Saint Louis University
  178396 : 102, // University of Missouri-Columbia
  221759 : 102, // University of Tennessee-Knoxville
  230038 : 110, // Brigham Young University
  209551 : 110, // University of Oregon
  122436 : 110, // University of San Diego
  122612 : 110, // University of San Francisco
  228787 : 110, // University of Texas-Dallas
  111948 : 110, // Chapman University
  207500 : 110, // University of Oklahoma
  145725 : 117, // Illinois Institute of Technology
  232186 : 117, // George Mason University
  122409 : 117, // San Diego State University
  183044 : 117, // University of New Hampshire
  104151 : 117, // Arizona State University-Tempe
  181002 : 117, // Creighton University
  198516 : 117, // Elon University
  153603 : 117, // Iowa State University of Science and Technology
  132903 : 117, // University of Central Florida
  127060 : 117, // University of Denver
  110565 : 127, // California State University-Long Beach
  104179 : 127, // University of Arizona
  196060 : 127, // University at Albany
  218663 : 127, // University of South Carolina
  163268 : 127, // University of Maryland-Baltimore County
  190567 : 132, // CUNY-City College
  231174 : 132, // University of Vermont
  110583 : 132, // California State University-Fullerton
  165334 : 132, // Clark University
  146719 : 132, // Loyola University Chicago
  216366 : 132, // Thomas Jefferson University
  100663 : 132, // University of Alabama-Birmingham
  225511 : 132, // University of Houston
  129242 : 139, // Fairfield University
  120883 : 139, // University of the Pacific
  234030 : 139, // Virginia Commonwealth University
  204024 : 143, // Miami University-Oxford
  202480 : 143, // University of Dayton
  209542 : 143, // Oregon State University
  190044 : 143, // Clarkson University
  155317 : 143, // University of Kansas
  157085 : 143, // University of Kentucky
  199139 : 143, // University of North Carolina-Charlotte
  196592 : 143, // Touro University
  // ── Liberal Arts Colleges ─────────────────────────────────────────────
  168342 : 1, // Williams College
  164465 : 2, // Amherst College
  216287 : 4, // Swarthmore College
  161004 : 5, // Bowdoin College
  121345 : 7, // Pomona College
  168218 : 7, // Wellesley College
  112260 : 7, // Claremont McKenna College
  197036 : 10, // United States Military Academy
  173258 : 10, // Carleton College
  115409 : 10, // Harvey Mudd College
  197133 : 13, // Vassar College
  189097 : 13, // Barnard College
  130697 : 13, // Wesleyan University
  198385 : 13, // Davidson College
  191515 : 13, // Hamilton College
  167835 : 13, // Smith College
  153384 : 13, // Grinnell College
  230959 : 13, // Middlebury College
  234207 : 21, // Washington and Lee University
  190099 : 22, // Colgate University
  233374 : 22, // University of Richmond
  212911 : 24, // Haverford College
  161086 : 24, // Colby College
  160977 : 24, // Bates College
  166124 : 27, // College of the Holy Cross
  173902 : 28, // Macalester College
  166939 : 29, // Mount Holyoke College
  126678 : 30, // Colorado College
  211273 : 30, // Bryn Mawr College
  211291 : 30, // Bucknell University
  213385 : 30, // Lafayette College
  202523 : 34, // Denison University
  212577 : 35, // Franklin and Marshall College
  120254 : 35, // Occidental College
  195526 : 37, // Skidmore College
  121257 : 37, // Pitzer College
  130590 : 37, // Trinity College
  141060 : 37, // Spelman College
  229267 : 37, // Trinity University
  123165 : 37, // Scripps College
  399911 : 37, // Soka University of America
  196866 : 44, // Union College
  156295 : 45, // Berea College
  203535 : 45, // Kenyon College
  212009 : 45, // Dickinson College
  218070 : 45, // Furman University
  221519 : 45, // Sewanee: The University of the South
  170286 : 50, // Hillsdale College
  174844 : 50, // St. Olaf College
  149781 : 50, // Wheaton College
  128902 : 50, // Connecticut College
  152673 : 50, // Wabash College
  156408 : 55, // Centre College
  221351 : 55, // Rhodes College
  124292 : 55, // Thomas Aquinas College
  150400 : 58, // DePauw University
  237057 : 58, // Whitman College
  204501 : 58, // Oberlin College and Conservatory
  212674 : 58, // Gettysburg College
  195216 : 58, // St. Lawrence University
  209922 : 63, // Reed College
  148016 : 63, // Principia College
  234085 : 65, // Virginia Military Institute
  239017 : 65, // Lawrence University
  138600 : 67, // Agnes Scott College
  218973 : 67, // Wofford College
  170532 : 67, // Kalamazoo College
  173647 : 70, // Gustavus Adolphus College
  189088 : 70, // Bard College
  214175 : 70, // Muhlenberg College
  174747 : 73, // College of St. Benedict
  191630 : 73, // Hobart and William Smith Colleges
  146481 : 75, // Lake Forest College
  168281 : 76, // Wheaton College
  150455 : 76, // Earlham College
  206589 : 76, // College of Wooster
  210401 : 76, // Willamette University
  210669 : 76, // Allegheny College
  146427 : 76, // Knox College
  174792 : 82, // St. John's University
  167996 : 82, // Stonehill College
  152390 : 84, // Saint Mary's College
  163976 : 84, // St. John's College
  216524 : 84, // Ursinus College
  228343 : 84, // Southwestern University
  222983 : 84, // Austin College
  184348 : 84, // Drew University
  216667 : 84, // Washington and Jefferson College
  170301 : 84, // Hope College
  213251 : 92, // Juniata College
  238333 : 92, // Beloit College
  164216 : 92, // Washington College
  125763 : 92, // Whittier College
  183239 : 96, // Saint Anselm College
  236328 : 96, // University of Puget Sound
  140553 : 96, // Morehouse College
  163912 : 96, // St. Mary's College of Maryland
  143084 : 96, // Augustana College
  213668 : 96, // Lycoming College
  209056 : 96, // Lewis & Clark College
  233295 : 96, // Randolph-Macon College
  216278 : 96, // Susquehanna University
  245652 : 96, // St. John's College
  107080 : 96, // Hendrix College
  232256 : 107, // Hampden-Sydney College
  451927 : 107, // Patrick Henry College
  195304 : 109, // Sarah Lawrence College
  157818 : 109, // Transylvania University
  239716 : 111, // St. Norbert College
  209065 : 111, // Linfield College
  153834 : 111, // Luther College
  145691 : 111, // Illinois College
  150756 : 115, // Hanover College
  125727 : 115, // Westmont College
  167288 : 115, // Massachusetts College of Liberal Arts
  231059 : 115, // Saint Michael's College
  174251 : 115, // University of Minnesota Morris
  198950 : 115, // Meredith College
  216807 : 121, // Westminster College
  230816 : 121, // Bennington College
  215798 : 121, // Saint Vincent College
  204909 : 121, // Ohio Wesleyan University
  153162 : 121, // Cornell College
  139393 : 126, // Covenant College
  233426 : 126, // Roanoke College
  162654 : 126, // Goucher College
  153144 : 126, // Coe College
  160959 : 126, // College of the Atlantic
  168546 : 131, // Albion College
  153108 : 131, // Central College
  232681 : 131, // University of Mary Washington
  196219 : 131, // State University of New York at Purchase College
  262129 : 135, // New College of Florida
  133492 : 135, // Eckerd College
  173300 : 135, // Concordia College at Moorhead
  199111 : 135, // University of North Carolina at Asheville
  232308 : 135, // Hollins University
  165671 : 135, // Emmanuel College
  183071 : 135, // University of New Hampshire at Manchester
  217873 : 135, // Claflin University
  199607 : 143, // Salem College
  158477 : 143, // Centenary College of Louisiana
  239628 : 143, // Ripon College
  175980 : 146, // Millsaps College
  150604 : 146, // Franklin College
  168786 : 146, // Aquinas College
  191676 : 146, // Houghton College
  440396 : 146, // New Saint Andrews College
  191533 : 151, // Hartwick College
  107512 : 151, // Ouachita Baptist University
  243151 : 151, // University of Puerto Rico in Cayey
  147341 : 154, // Monmouth College
  173142 : 154, // Bethany Lutheran College
  166018 : 156, // Hampshire College
  158802 : 156, // Dillard University
  140696 : 156, // Oglethorpe University
  220181 : 156, // Fisk University
  154527 : 156, // Wartburg College
  165936 : 156, // Gordon College
  233301 : 156, // Randolph College
  218539 : 163, // Presbyterian College
  206525 : 164, // Wittenberg University
  179946 : 164, // Westminster College
  233718 : 164, // Sweet Briar College
  231581 : 167, // Bridgewater College
  106342 : 167, // Lyon College
  233897 : 167, // University of Virginia's College at Wise
  210571 : 170, // Albright College
  220710 : 170, // Maryville College
  198613 : 172, // Guilford College
  198756 : 173, // Johnson C. Smith University
  123457 : 173, // Simpson University
  442295 : 175, // Ava Maria University
  190646 : 176, // Medgar Evers College-CUNY
  455770 : 176, // Providence Christian College
  234173 : 178, // Virginia Wesleyan University
  192864 : 178, // Marymount Manhattan College
  156745 : 180, // Georgetown College
  210492 : 180, // Bryn Athyn College of the New Church
  176406 : 180  // Tougaloo College
};

/** IPEDS unitids that belong to the Liberal Arts Colleges ranking list */
export const USNEWS_LAC_IDS = new Set<number>([
  168342, 164465, 216287, 161004, 121345, 168218, 112260, 197036, 173258, 115409, 197133, 189097, 130697, 198385, 191515, 167835, 153384, 230959, 234207, 190099, 233374, 212911, 161086, 160977, 166124, 173902, 166939, 126678, 211273, 211291, 213385, 202523, 212577, 120254, 195526, 121257, 130590, 141060, 229267, 123165, 399911, 196866, 156295, 203535, 212009, 218070, 221519, 170286, 174844, 149781, 128902, 152673, 156408, 221351, 124292, 150400, 237057, 204501, 212674, 195216, 209922, 148016, 234085, 239017, 138600, 218973, 170532, 173647, 189088, 214175, 174747, 191630, 146481, 168281, 150455, 206589, 210401, 210669, 146427, 174792, 167996, 152390, 163976, 216524, 228343, 222983, 184348, 216667, 170301, 213251, 238333, 164216, 125763, 183239, 236328, 140553, 163912, 143084, 213668, 209056, 233295, 216278, 245652, 107080, 232256, 451927, 195304, 157818, 239716, 209065, 153834, 145691, 150756, 125727, 167288, 231059, 174251, 198950, 216807, 230816, 215798, 204909, 153162, 139393, 233426, 162654, 153144, 160959, 168546, 153108, 232681, 196219, 262129, 133492, 173300, 199111, 232308, 165671, 183071, 217873, 199607, 158477, 239628, 175980, 150604, 168786, 191676, 440396, 191533, 107512, 243151, 147341, 173142, 166018, 158802, 140696, 220181, 154527, 165936, 233301, 218539, 206525, 179946, 233718, 231581, 106342, 233897, 210571, 220710, 198613, 198756, 123457, 442295, 190646, 455770, 234173, 192864, 156745, 210492, 176406
]);