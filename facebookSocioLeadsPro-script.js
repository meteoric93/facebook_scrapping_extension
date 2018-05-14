var user_id = '';
var user_email = '';
var composer_id = '';
var threads = [];

fetchData();
async function fetchData() {
    var html = document.getElementsByTagName('html')[0].innerHTML;
    var response = null;

    user_id = getValueByRegex(html, /USER_ID\":\"(.+?)(?=\")/g);
    if (user_id == null) {
        user_id = getValueByRegex(html, /ACCOUNT_ID\":\"(.+?)(?=\")/g);
    }

    composer_id = getValueByRegex(html, /composerID\":\"(.+?)(?=\")/g);
    if (composer_id == null) {
        composer_id = getValueByRegex(html, /xhpc_composerid\"\svalue=\"(.+?)(?=\")/g);
    }

    response = await $.ajax({
        url: 'https://www.facebook.com/settings',
        type: "GET",
        async: true,
        success: function(response){ return response; },
        error: function(){ return null; }
    });
    if(response != null) {
        user_email = getValueByRegex(response, /Primary: <strong>(.+?)(?=<)/g);
        if(user_email != null) {
            user_email = user_email.replace("&#064;", "@");
        }
    }

    response = await $.ajax({
        url: 'https://www.facebook.com/groups/?category=manage',
        type: "GET",
        async: true,
        success: function(response){ return response; },
        error: function(){ return null; }
    });
    if(response != null) {
        var group_data = [];
        var objects = getListByRegex(response, /_266w">(.+?)(?=<\/a>)/g);
        for(var i = 0; i < objects.length; i ++){
            var item = objects[i];
            var group = await getGroupDataByItem(item);
            if(group != null) {
                group_data.push(group);
            }
        }
        var JsonStr = JSON.stringify(group_data);
        response = await $.ajax({
            url: "https://api.socioleadspro.com/api/Service/AddFBGroup",
            type: "POST",
            async: true,
            data: { "": JsonStr },
            success: function(response){ return response; },
            error: function(){ return null; }
        });
        
        if(response) {
            for(var i = 0; i < group_data.length; i ++){
                var element = group_data[i];
                var group_home_url = element.GroupURL.replace("?ref=group_browse_new", "");
                response = await $.ajax({
                    url: group_home_url,
                    type: "GET",
                    async: true,
                    success: function (response) { return response; },
                    failure: function(error) { return null; },
                    error: function(xhr, status, error) { return null; }
                });
                if(response != null) {
                    var feeds = scrapFeedDataByContext(response, element.Groupname, element.Groupid);
                    var json_str = JSON.stringify(feeds);
                    response = await $.ajax({
                        url: "https://api.socioleadspro.com/api/Service/AddFBGroupPost",
                        type: "POST",
                        async: true,
                        data: { "": json_str },
                        success: function (response) { return response },
                        failure: function(error) { return null; }
                    });
                    if(response && element.EndCursor != null) {
                        if(typeof(Worker) !== "undefined"){
                            if(typeof(threads[element.Groupid]) == "undefined"){
                                response = await $.ajax({
                                    url: chrome.runtime.getURL('facebookWorker.js'),
                                    type: "GET",
                                    async: true,
                                    success: function(response){ return response; },
                                    error: function(){ return null; }
                                });
                                var blob = new Blob([response], {type: 'application/javascript'});
                                var worker = new Worker(URL.createObjectURL(blob));
                                worker.addEventListener('message', async function(e) {
                                    switch(e.data.action){
                                        case 'feedpost':
                                            var result = await $.ajax({
                                                url: "https://api.socioleadspro.com/api/Service/AddFBGroupPost",
                                                type: "POST",
                                                async: true,
                                                data: {'': e.data.data},
                                                success: function (response) { return response },
                                                failure: function(error) { return error; }
                                            });
                                            if(result) {
                                                findWorker(e.data.group_id).postMessage({
                                                    action:'postsuccess',
                                                    params: null
                                                });
                                            }
                                        break;
                                        case 'terminate':
                                            findWorker(e.data.group_id).terminate();
                                            findWorker(e.data.group_id) = undefined;
                                        break;
                                        default:
                                            findWorker(e.data.group_id).terminate();
                                            findWorker(e.data.group_id) = undefined;
                                        break;
                                    }
                                }, false);
                                worker.postMessage({
                                    action:'init',
                                    params: {
                                        group_id: element.Groupid,
                                        group_name:element.Groupname,
                                        user_id: user_id,
                                        last_view_time:element.LastViewTime,
                                        end_cursor:element.EndCursor,
                                        rev:element.Rev,
                                        spin_r:element.SpinR,
                                        spin_t:element.SpinT,
                                        story_index:feeds.length
                                    }
                                });
                                
                                var thread = {};
                                thread[element.Groupid] = worker;
                                threads.push(thread);
                            }
                        }
                    }
                }
            }
        }
    }
}

async function getGroupDataByItem(item) {
    var group_url = getValueByRegex(item, /<a href=\"(.+?)(?=\")/g);
    var group_name = getValueByRegex(item, /show="1">(.*)/g)
    var response = null;
    var end_cursor = null;
    var last_view_time = null;
    var group_id = null;
    var membercount = 0;
    var adminmembercount = 0;
    var group_admin_ids = '';
    var group_admin_names='';
    var group_type = '';
    var lstadmin = 0;
    var count = 0;
    var rev = null;
    var spin_r = null;
    var spin_t = null;

    try {
        response = await $.ajax({
            url: group_url,
            type: "GET",
            async: true,
            success: function(response){ return response; },
            error: function(){ return null; }
        });
        if(response != null) {
            end_cursor = getValueByRegex(response, /end_cursor:\"(.+?)(?=\")/g);
            last_view_time = getValueByRegex(response, /last_view_time%22%3A(.+?)(?=%)/g);
            group_id = getValueByRegex(response, /entity_id\":\"(.+?)(?=\")/g);
        }
        var admin_url = group_url.replace("?ref=group_browse_new", "admins/");
        response = await $.ajax({
            url: admin_url,
            type: "GET",
            async: true,
            success: function(response){ return response; },
            error: function(){ return null; }
        });
        if(response != null) {
            
            rev = getValueByRegex(response, /\"server_revision\":(.+?)(?=,)/g);
            spin_r = getValueByRegex(response, /\"__spin_r\":(.+?)(?=,)/g);
            spin_t = getValueByRegex(response, /\"__spin_t\":(.+?)(?=,)/g);

            group_type = getValueByRegex(response, /_4dbn\">(.+?)(?=<)/g);
            if (group_type == null) {
                if (getValueByRegex(response, /Public Group/g) != null) {
                    group_type = "Public";
                }
                else if (getValueByRegex(response, /Secret Group/g) != null) {
                    group_type = "Private";
                }
                else if (getValueByRegex(response, /Closed Group/g) != null) {
                    group_type = "Closed";
                }
            } 

            member_count = getValueByRegex(response, /_grt\s_50f8\">(.+?)(?=<)/g);
            if(member_count == null) {
                member_count = 0;
            }

            var arr_admin_ids = getListByRegex(response, /clearfix\s_60rh\s_gse(.+?)(?=_60rj)/g);
            if(arr_admin_ids != null){
                arr_admin_ids.forEach(function (item) {
                    var id = getValueByRegex(item, /id=\"admins_moderators_(.+?)(?=\")/g);
                    var name = getValueByRegex(item, /aria-label=\"(.+?)(?=\")/g);
                    group_admin_ids += id + '~';
                    group_admin_names += name + '~';
                });
                group_admin_ids = group_admin_ids.substring(0, group_admin_ids.length - 1);
                group_admin_names = group_admin_names.substring(0, group_admin_names.length - 1);
            } else {
                group_admin_ids = '';
                group_admin_names = '';
            }
            
            return {
                Groupid: group_id, 
                Groupname: group_name,
                Grouptype: group_type,
                GroupURL: group_url,
                Membercount: member_count, 
                Groupadminid: group_admin_ids, 
                Groupadminname: group_admin_names,  
                Username: user_email,
                EndCursor: end_cursor,
                LastViewTime: last_view_time,
                Rev: rev,
                SpinR: spin_r,
                SpinT: spin_t
            };
        }
    }catch(error){
        return null;
    }    
}

function scrapFeedDataByContext(context, group_name, group_id) {
    var arr_feeds_items = getListByRegex(context, /<div\sclass="_4-u2\smbm\s_4mrt\s_5jmm\s_5pat\s_5v3q\s_4-u8(.+?)(?=<div\sclass="_4-u2\smbm\s_4mrt\s_5jmm\s_5pat\s_5v3q\s_4-u8)/g);
    var feeds = [];
    if(arr_feeds_items != null) {
        arr_feeds_items.forEach(function (item) {
            var post_id = null;
            var post_type = '';
            var post_url = ''
            var post_on = null;
            var poster_id = null;
            var poster_name = '';
            var poster_image = '';
            var feed_title = '';
            var feed_text = '';
            var feed_description = '';
            var destination_url = '';
            var ad_video_url = ''; 
            var reaction_count = 0;
            var share_count = 0;
            var comment_count = 0;

            post_id = getValueByRegex(item, /top_level_post_id&quot;:&quot;(.+?)(?=&quot;)/g);
            if(post_id == null) return;

            ad_video_url = getValueByRegex(item, /aspect_ratio:1,hd_src:\"(.+?)(?=\")/g);
            if (ad_video_url == null) {
                ad_video_url = getValueByRegex(item, /sd_src:\"(.+?)(?=\")/g);
            }

            var ad_img_url = '';

            if (ad_video_url == null) {
                ad_img_url = getValueByRegex(item, /scaledImageFitWidth\simg\"\ssrc=\"(.+?)(?=\")/g);
                if (ad_img_url == null) {
                    ad_img_url = getValueByRegex(item, /class=\"_3chq(.+?)(?=\/><div")/g);
                    ad_img_url = getValueByRegex(ad_img_url, /src=\"(.+?)(?=\")/g);
                }
                if(ad_img_url != null) {
                    ad_img_url = ad_img_url.replace(/&amp;/g, "&");
                }
                if (ad_img_url == null) {
                    ad_img_url = getValueByRegex(item, /<img\ssrc=\"(.+?)(?=\")/g);
                    if(ad_img_url != null)
                        ad_img_url = ad_img_url.replace(/&amp;/g, "&");
                }
                if (ad_img_url == null) {
                    var arrSplirimage = item.split("class=\"_kvn img\"");
                    arrSplirimage.forEach(function (image) {
                        ad_img_url = getValueByRegex(image, /class=\"_kvn\simg\"src=\"(.+?)(?=\")/g);
                        if(ad_img_url != null) {
                            ad_img_url = ad_img_url.replace(/&amp;/g, "&");
                            return;
                        }
                    });
                }
            }

            if (ad_video_url == null) {
                post_type = 'IMAGE';
                ad_video_url = ad_img_url;
            }
            else if (ad_video_url != null) {
                post_type = 'VIDEO';
                ad_video_url = ad_video_url;
            }

            post_url = "https://www.facebook.com/groups/" + group_id + "/permalink/" + post_id;

            var regex = new RegExp("ftentidentifier:\"" + post_id + "(.*)");
            var memo_resource = getValueByRegex(context, regex);

            reaction_count = getValueByRegex(memo_resource, /reactioncount:(.+?)(?=,reactioncountmap:)/g);
            if (reaction_count == null) {
                reaction_count = '0';
            }

            comment_count = getValueByRegex(memo_resource, /commentcount:(.+?)(?=,commentTotalCount:)/g);
            if (comment_count == null) {
                comment_count = '0';
            }

            share_count = getValueByRegex(memo_resource, /sharecount:(.+?)(?=,sharecountreduced:)/g);
            if (share_count == null) {
                share_count = '0';
            }

            post_on = getValueByRegex(item, /data-utime=\"(.+?)(?=\")/g);

            poster_name = getValueByRegex(item, /alt=\"\"\saria-label=\"(.+?)(?=\")/g);
            if (poster_name == null) {
                poster_name = getValueByRegex(item, /alt=\"\"\saria-label=\"(.+?)(?=role=\"img\")/g);
            }
            if(poster_name != null) {
                poster_name = poster_name.replace(/&amp;/g, '&');
                poster_name = poster_name.replace(/<[^>]*>/g, '');
            }

            poster_id = getValueByRegex(item, /member_id=(.+?)(?=&amp;)/g);
            if (poster_id==null) {
                poster_id = getValueByRegex(item, /<a\sclass=\"_5pb8\sa_6ipbh5g0w\s_8o\s_8s\slfloat\s_ohe\"(.+?)(href=\"https:\/\/www.facebook.com\/)(.+?)(?=\?)/g);
            }

            console.log('poster_id-----------------------------------');
            console.log(poster_id);
            console.log('poster_name-----------------------------------');
            console.log(poster_name);
            
            poster_image = getValueByRegex(item, /_s0\s_4ooo\s_5xib\s_44ma\s_54ru\simg\"\ssrc=\"(.+?)(?=\")/g);
            if (poster_image == null) {
                poster_image = getValueByRegex(item, /_s0\s_4ooo\s_5xib\s_5sq7\s_44ma\s_rw img\"\ssrc=\"(.+?)(?=\")/g);
            }
            if(poster_image != null) {
                poster_image = poster_image.replace(/&amp;/g, "&");
            }

            if (ad_video_url == poster_image) {
                ad_video_url = '';
            }

            feed_title = getValueByRegex(item, /mbs\s_6m6\s_2cnj\s_5s6c(.*)data-lynx-mode=\"asynclazy\">(.+?)(?=<\/a>)/g);

            feed_text = getValueByRegex(item, /<p>(.+?)(?=<\/p>)/g);
            if(feed_text != null){
                feed_text = feed_text.replace(/<[^>]*>/g, '').replace("&#039;", "").replace("&amp;", "&");
                feed_text = feed_text.replace(/&amp;/g, '&');
            }
        
            var feed_description_text = getValueByRegex(item, /class=\"_6m7\s_3bt9\">(.+?)(?=<\/div>)/g);
            if(feed_description_text == null) {
                feed_description_text = '';
            }
            
            var feed_description_link = getValueByRegex(item, /class=\"_6lz\s_6mb\s_1t62\sellipsis\">(.+?)(?=<\/div>)/g);
            if(feed_description_link == null) {
                feed_description_link = '';
            }

            feed_description = feed_description_text + feed_description_link;
            feed_description = feed_description.replace(/<[^>]*>/g, '');
            feed_description = feed_description.replace(/&amp;/g, '&');
        
            destination_url = getValueByRegex(item, /class=\"mbs\s_6m6\s_2cnj\s_5s6c\"><a(.*)<a\shref=\"https:\/\/l.facebook.com\/l.php\?u=(.+?)(?=\")/g);
            
            if (destination_url != null) {
                destination_url = destination_url.replace(/&amp;/g, "&");
                destination_url = unescape(destination_url);
                if (destination_url.includes("&h=AT") || destination_url.includes('&h=AT')) {
                    var temp_url = destination_url.split('&h=AT');
                    destination_url = temp_url[0];
                }
            }

            feeds.push({ 
                GroupId: group_id, 
                GroupName: group_name,
                PostId: post_id,
                PostType: post_type,
                postUrl: post_url,
                FeedTitle: feed_title,  
                FeedText: feed_text,
                FeedDescription: feed_description, 
                PostImgUrl: ad_video_url, 
                DateTimeOfPost: post_on, 
                DestinationURL: destination_url,  
                UserProfileId: poster_id, 
                ProfileName: poster_name, 
                ProfileImage: poster_image, 
                NoOfLike: reaction_count, 
                NoOfComment: comment_count, 
                NoOfShare: share_count,  
            });
        });
    }
    return feeds;
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

function findWorker (key) {
    for(var i = 0; i < threads.length; i ++){
        var element = threads[i];
        if(element[key] != null ) {
            return element[key];
        }
    }
}