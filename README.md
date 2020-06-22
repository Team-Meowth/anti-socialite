# Anti-Socialite

**Version**: 1.0.0

## Overview
- As a user I would like to find a movie to watch that is like the movies that I already like. 

## Getting Started
- npm i

## Architecture
<!-- Provide a detailed description of the application design. What technologies (languages, libraries, etc) you're using, and any other relevant design information. -->

## Change Log
<!-- Use this area to document the iterative changes made to your application as each feature is successfully implemented. Use time stamps. Here's an examples:

01-01-2001 4:59pm - Application now has a fully-functional express server, with GET and POST routes for the book resource.-->

## Credits and Collaborations
- Peter Sankiewicz
- Leah Russo
- Marta Anthony
- Michael Refvem
- Trevor Stubbs


## Back-End To Front-End
- `finalFrontendArray = [[similarMovieArray], [genreMovieArray], [votesMovieArray]]`
    - Column 1 - Movies that are similar
    - Column 2 - Movies with the same genre
    - Column 2 - Movies with similar popularity


``` JavaScript
<% finalFrontendArray.forEach((value, index) =>{ %>
  <% if(index === 0){ %>
    <%<h3>Similar</h3>%>
    <% value.forEach(element => { %>
      <%=<p>element.title</p> %>
    <%})%>
  <%}%>  
<%} ) %>
```