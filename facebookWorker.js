var group_id = '';
var group_name = '';
var user_id = '';
var last_view_time = '';
var end_cursor = '';
var rev = '';
var spin_r = '';
var spin_t = '';
var story_index = 1;
var index = 1;

const httpGet = function (url) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    return new Promise((resolve, reject) =>  {
        request.onload = function(response) {
            resolve(request.responseText);
        };
        request.onerror = function(error) {
            reject("Network error");
        };
        request.send();
    });
};

const httpPost = function (url, data) {
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    return new Promise((resolve, reject) =>  {
        request.onload = function(response) {
            resolve(request.responseText);
        };
        request.onerror = function(error) {
            reject("Network error:" + error);
        };
        request.send(data);
    });
};

onmessage = function(event) {
    var data = event.data;
    if(data != null) {
        switch(data.action) {
            case 'init':
                group_id = data.params.group_id;
                group_name = data.params.group_name;
                user_id = data.params.user_id;
                last_view_time = data.params.last_view_time;
                end_cursor = data.params.end_cursor;
                rev = data.params.group_id;
                spin_r = data.params.spin_r;
                spin_t = data.params.spin_t;
                story_index = data.params.story_index;
                scrapContextByAPI();
            break;
            case 'postsuccess':
                scrapContextByAPI();
            break;
            default:
            break;
        }
    }
};

async function scrapContextByAPI() {
    var url = 'https://www.facebook.com/ajax/pagelet/generic.php/GroupEntstreamPagelet?'+
    'dpr=1'+
    '&no_script_path=1'+
    '&data={'+
        '"last_view_time":'+last_view_time+', "is_file_history":null, "is_first_story_seen":true, "story_index":'+(index * 10)+','+
        '"end_cursor":"'+end_cursor+'",'+
        '"group_id":'+group_id+', "has_cards":true, "multi_permalinks":[], "posts_visible":'+(index * 10)+','+
        '"trending_stories":[], "sorting_setting":null }'+
    '&__user='+user_id+
    '&__a=1'+
    '&__req=fetchstream_'+index+
    '&__be=1'+
    '&__pc=PHASED:DEFAULT'+
    '&__rev='+rev+
    '&__spin_r='+spin_r+
    '&__spin_b=trunk'+
    '&__spin_t='+spin_t+
    '&__adt='+index ;
    try {
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.onload = function(response) {
            var response = unicodeToString(request.responseText);
            story_index += 10;
            index ++;
            var feeds = [];
            feeds = scrapFeedDataByContext(response, group_name, group_id);
            if(feeds != null && feeds.length != 0) {
                console.log('------------------------------- Feed data of '+group_name+' group -------------------------------');
                console.log(feeds)
                console.log('-------------------------------------------------------------------------------------------------')
                var json_str = JSON.stringify(feeds);
                postMessage({action:'feedpost', group_id: group_id, data: json_str});
            }else{
                postMessage({action:'terminate', group_id: group_id, data:null});
                return;
            }
        };
        request.onerror = function(error) {
            postMessage({action:'terminate', data:null});
            console.log("Network error");
        };
        request.send();
    } catch (error) {
        postMessage({action:'terminate', data:null});
        console.log(error);
    }
}

function scrapFeedDataByContext(context, group_name, group_id) {
    var arr_feeds_items = getListByRegex(context, /_4-u2\smbm\s_4mrt\s_5jmm\s_5pat\s_5v3q\s_4-u8(.+?)(?=_4-u2\smbm\s_4mrt\s_5jmm\s_5pat\s_5v3q\s_4-u8)/g);
    var feeds = [];
    if(arr_feeds_items != null) {
        arr_feeds_items.forEach(function (item) {
            var profile_id = null;
            var profile_image = '';
            var post_id = null;
            var post_type = '';
            var post_url = ''
            var post_on = null;
            var poster_id = null;
            var poster_name = '';
            var feed_title = '';
            var feed_text = '';
            var feed_description = '';
            var destination_url = '';
            var ad_video_url = ''; 
            var reaction_count = 0;
            var share_count = 0;
            var comment_count = 0;
            
            end_cursor = getValueByRegex(context, /end_cursor:\"(.+?)(?=\")/g);
            if(end_cursor == null) {
                end_cursor = getValueByRegex(context, /end_cursor\":\"(.+?)(?=\")/g);
            }

            last_view_time = getValueByRegex(context, /last_view_time%22%3A(.+?)(?=%)/g);

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
                    ad_img_url = getValueByRegex(item, /<img(.*)src=\"(.+?)(?=\")/g);
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

            profile_id = getValueByRegex(item, /member_id=(.+?)(?=&amp;)/g);
            if (profile_id==null) {
                profile_id = user_id;
            }

            profile_image = getValueByRegex(item, /_s0\s_4ooo\s_5xib\s_44ma\s_54ru\simg\"\ssrc=\"(.+?)(?=\")/g);
            if (profile_image == null) {
                profile_image = getValueByRegex(item, /_s0\s_4ooo\s_5xib\s_5sq7\s_44ma\s_rw img\"\ssrc=\"(.+?)(?=\")/g);
            }
            if(profile_image != null) {
                profile_image = profile_image.replace(/&amp;/g, "&");
            }

            if (ad_video_url == profile_image) {
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
                UserProfileId: profile_id, 
                ProfileName: poster_name, 
                ProfileImage: profile_image, 
                NoOfLike: reaction_count, 
                NoOfComment: comment_count, 
                NoOfShare: share_count,  
            });
        });
    }
    return feeds;
}

function unicodeToString(text) {
    return text.replace(/\\"/g, '"').replace(/\\u003C/g, '<').replace(/\\\//g,'/').replace(/\\u[\dA-F]{4}/gi, function (match) {
        return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
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