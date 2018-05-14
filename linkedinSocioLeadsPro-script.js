var email = '';
var memberId = '';
var csrfToken = '';
var postGroupData = [];
var groupObjects = [];
var postFeedData = [];
var feedObjects = [];
var startIndex = 0;

linkedingroupdata();

function linkedingroupdata() {
    var Linkedin_data = document.getElementsByTagName('html')[0].innerHTML;
    memberId = getValueByRegex(Linkedin_data, /urn:li:member:(.+?)(?=&quot;)/g);
    csrfToken = getValueByRegex(document.cookie, /JSESSIONID=\"(.+?)(?=\")/g);

    var linkedinurl = "https://www.linkedin.com/psettings/email/";    
    $.ajax({
        url: linkedinurl,
        type: "GET",
        async: true,
        success: function (profileResponse) {
            email = getValueByRegex(profileResponse, /email-address\">(.+?)(?=<\/p>)/g);
            var groupApiUrl = "https://www.linkedin.com/communities-api/v1/communities/memberships/" + memberId + "?projection=FULL&sortBy=RECENTLY_JOINED&count=500&csrfToken=" + csrfToken;
            $.ajax({
                url: groupApiUrl,
                type: "GET",
                async: true,
                success: function (receivedResponse) {
                    groupObjects = receivedResponse["data"];
                    groupObjects.forEach(function (groups) {
                        var totalMembers = groups["group"]["totalMembers"];
                        var groupName = groups["group"]["mini"]["name"];
                        var communityType = groups["group"]["communityType"];
                        var groupId = groups["group"]["id"];
                        postGroupData.push({ 
                            Groupid: groupId, 
                            Grouptype: communityType, 
                            Groupname: groupName, 
                            Membercount: totalMembers, 
                            LdUserName: email 
                        });
                    });
                    if(postGroupData.length == groupObjects.length && postGroupData.length > 0) {
                        var JsonStr = JSON.stringify(postGroupData);
                        $.ajax({
                            url: "https://api.socioleadspro.com/api/Service/AddLIGroup",
                            type: "POST",
                            data: { "": JsonStr },
                            success: function (response_data) {
                                postGroupData.forEach(element => {
                                    linkedingrouppostdata(element.Groupid, csrfToken, element.Groupname); 
                                });
                            }
                        });
                    }
                }
            });
        }
    });
}
function linkedingrouppostdata(grpid, csrfToken, grpname) {
    var grpouppostUrl = "https://www.linkedin.com/communities-api/v1/activities/community/" + grpid + "?count=10&activityType=DISCUSSION&sort=RECENT&count=15&start=0&csrfToken=" + csrfToken;
    $.ajax({
        url: grpouppostUrl,
        type: "GET",
        async: true,
        success: function (grpPostResponse) {
            startIndex ++;
            feedObjects = grpPostResponse["data"];
            feedObjects.forEach(function (grppost) {
                var datePosted = grppost["datePosted"];
                var posterid = grppost["author"]["id"];
                var posterName = grppost["author"]["name"];
                var profileUrl = grppost["author"]["profileUrl"];
                var author_imageUrl = grppost["author"]["imageUrl"];
                if (author_imageUrl.includes('/gcrc'))
                {
                    author_imageUrl = author_imageUrl+'<a>'
                    author_imageUrl = getValueByRegex(author_imageUrl, /\/gcrc(.+?)(?=<a>)/g);
                    author_imageUrl = 'https://media.licdn.com' + author_imageUrl;
                }
                var body = grppost["body"];
                var title = grppost["title"];
                var postId = grppost["id"];
                if(postId == null || postId == '') return;
                var contentUrl = grppost["contentUrl"];
                var contentTitle = grppost["contentTitle"];
                var imageUrl = grppost["imageUrl"];
                var numberOfLikes = grppost["numberOfLikes"];
                var numberOfComments = grppost["numberOfComments"];
                postFeedData.push({ 
                    DateTimeOfPost: datePosted, 
                    GroupName: grpname, 
                    GroupId: grpid, 
                    PosterUrl: profileUrl, 
                    postId: postId, 
                    PosterImageUrl: author_imageUrl, 
                    profileName: posterName, 
                    postImgUrl: contentUrl, 
                    PostTitle: contentTitle, 
                    Message: body, 
                    contentUrl: contentUrl, 
                    contentTitle: contentTitle, 
                    numberOfLikes: numberOfLikes, 
                    numberOfComments: numberOfComments, 
                    PostedImagedescription: 'NA', 
                    PosterId: posterid 
                });
            });
            if(startIndex == groupObjects.length) {
                for(var i = 0; i < postFeedData.length; i += 100) {
                    var feedData = postFeedData.slice(i, i + 100);
                    var JsonStr = JSON.stringify(feedData);
                    $.ajax({
                        url: "https://api.socioleadspro.com/api/Service/AddLIGroupPost",
                        type: "POST",
                        async: true,
                        data: { "": JsonStr },
                        success: function (response_data) {
                            console.log(response_data);
                        },
                        failure: function(errMsg) {
                            console.log(errMsg);
                        }
                    });
                }
            }
        },
        failure: function(errMsg) {
            startIndex ++;
            console.log(errMsg);
        },
        error: function(xhr, status, error) {
            startIndex ++;
            console.log(error);
        }
    })
}

function getValueByRegex(pageSource, regex) {
    try {
        var matches = regex.exec(pageSource);
        return matches[matches.length-1];
    } catch (e) {
        return null;
    }
}

function getListByRegex(pageSource, regex) {
    try {
        var matches = pageSource.match(regex);
        return matches;
    } catch (e) {
        return null;
    }
}