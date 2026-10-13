# Iobot-

## Installation

This assumes you’re working from a computer, that you’re on Windows, and that you’re using *VS Code*. 
There is documentation(via a quick google search) for everything if you are on Linux or Mac as well.

Check the dependancies section before setting up the workspace. 

1. Clone the repository: <https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository>
2. Create the Virtual Environment: <https://docs.python.org/3/library/venv.html>
  - Navigate to the server directory using the terminal
  - To navigate up the tree: cd..
  - To navigate to down the tree: cd folder_name

Then run: 
```
python -m venv .venv
```
and then: 
```
.venv\Scripts\activate.bat
```

The first line creates a python virtual environment(venv), while the second line activates it. When you’re done with a work session, you can deactivate the environment(thought you could leave it running) using: 

```
deactivate
```

There will be a noticeable difference in your terminal when the venv is activate. An example indicator is green text at the beginning of your prompt lines.

By the end, you should have a venv folder nested in the server directory. 

3. Double check the link between the client and server
  - PREREQ: VS Code Live Preview extension
  - Run this to start the app: 
    ```
    flask run
    ```
  - In the client directory, right click index.html, and click something along the lines of “show preview”
    - This should open a panel(on the right for me) with a display of the page 
  - Click the button at the bottom of the page
  - By the end of this step, you should see the page with a message indicating that the client and server are successfully connected/are communicating with each other

I didn’t test this on any device other than my own… So if you run into any issues, then cool, yay, troubleshooting time. 

### Dependancies 

#### Setting up the workspace

- Installing Python: <https://innovationspace.ansys.com/courses/courses/intro-to-python/lessons/prerequisites-installation-of-python/>
- Installing Git: <https://git-scm.com/book/en/v2/Getting-Started-Installing-Git>
- Setting up GitHub in VS Code: <https://code.visualstudio.com/docs/sourcecontrol/github>

Optional, but I recommend: 
- Helpful: VS Code Live Preview Extension - Allows you to see a preview the site from VS Code

#### Libraries 

The web server has two main dependancies: 
- Flask - The Web API
- Flask-CORS - Flask extension for linking clients to the server with a different origin

In your activated venv, run: 
```
pip install flask 
pip install flask-cors
```

If you would like to double check that the dependancies are downloaded, you can run:
```
pip list
```

#### Recommended References and Notes 

***Flask*** <br>
Documentation: <https://flask.palletsprojects.com/en/stable/> 

Smol kine warning:
The Flask tutorial uses a monolithic structure, meaning the entire web app is in one directory, and the server compiles the html files and sends them to the client. 

The project is currently decoupled, where the server and client are two distinct entities(the two major folders) that talk to each other. Instead of sending the html files to the client, the server is in charge of taking in client requests, and sending data(usually in the form of JSON data) back to the client. 

One of decoupling’s is that the page updates dynamically, meaning it doesn’t have to refresh to receive updates. With a monolithic architecture, the client has to update the entire page when it receives a newly composed html file from the server. In a decoupled architecture, the client receives data from the server, and updates that page itself using that data. 

Web App Architectures: <https://crystallize.com/answers/tech-dev/monolith-vs-decoupled-vs-headless>

As of now, the project is small enough that we could consolidate into a monolithic structure if we wanted to, but a decoupled workflow is easier for collaboration and makes working on the client and server distinct(it also sounds better in my opinion). 

***Front-End Tech***
The MDN curriculum has a lot of good tutorials and articles on CSS, HTML, and JS interactivity. 

Basic Website Development Tutorial: <https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Your_first_website><br>
Asynchronous JavaScript: <https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Async_JS><br>
Good Info on Server-side vs Client-side Programming: <https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_steps><br>
