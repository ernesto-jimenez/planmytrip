require 'rubygems'
require 'sinatra'
require 'haml'
require 'json'
require 'yql-query'
require 'yql'
require 'httparty'
require 'flickraw'
require 'redis'

FlickRaw.api_key='10957f5c6f100b5aec74635e49dae68b'
FlickRaw.shared_secret='107d21827e012cd3'

# Helpers
require './lib/render_partial'

# Set Sinatra variables
set :app_file, __FILE__
set :root, File.dirname(__FILE__)
set :views, 'views'
set :public_folder, 'public'
set :haml, {:format => :html5} # default Haml format is :xhtml

# Application routes
get '/' do
  File.read(File.join('public', 'index.html'))
end

post '/trip' do
  redirect to('/trip/whatever/edit')
end

get '/trip/:id/edit' do
  haml :index, :layout => :'layouts/application'
end

get '/trip/:id/suggestions' do
  Trip.find(params[:id]).places.to_json
end

get '/trip/:id/test' do
  city = params[:id].gsub(/_/, ' ')
  haml :test, locals: {places: Trip.new(city).places}
end

class Trip
  attr_accessor :city, :coords

  def initialize(city, coords=nil)
    self.city = city
    self.coords = coords || Trip.fetch_coords(city)
  end

  def self.find(id)
    return Trip.new('London')
  end

  QUERY = 'ancestor_woeid in
           (select woeid from geo.places where text="%{city}")
           and placetype="%{type}"'

  def places_yql
    yql = Yql::Client.new
    q = YqlQuery::Builder.new

    q.table('geo.places.descendants').
      select('placeTypeName, name').
      conditions(QUERY % {city: city, type: 16})

    yql.query = q.to_s
    yql.format = :json
    response = yql.get

    require 'pry'; binding.pry
    response.show
  end

  #PLACES_URL = "http://api.wikilocation.org/articles?lat=%{lat}&lng=%{lng}&type=landmark&limit=%{limit}&radius=2000"
  PLACES_URL = "https://api.foursquare.com/v2/venues/search?near=%{city}&categoryId=4deefb944765f83613cdba6e&oauth_token=LNE0NIZDYMP2TYW3NOIML43A4THTIX44YZVPIWDF3PCTEWVU&v=20130427"

  def places(limit=5)
    redis.cache(city) do
      places_4sq(limit).map do |place|
        place['photos'] = photos(place)
        place['title'] = place['name']
        place
      end
    end
  end

  def photos(place)
    photos = flickr.photos.search(sort: 'relevance',
                                  text: [
                                    city,
                                    (place['name'] || place['title'])
                                  ].join(' '),
                                  #tag: city,
                                  min_taken_date: '2001-01-01',
                                  #lat: place['lat'] || place['location']['lat'],
                                  #lon: place['lng'] || place['location']['lng'],
                                  privacy_filter: 1,
                                  accuracy: 11,
                                  content_type: 1,
                                  per_page: 5,
                                  radius: 0.5)

    photos.map do |photo|
      FlickRaw.url_z(photo)
    end
  end

  def places_4sq(limit)
    lat, lng = coords.split(',')
    response = HTTParty.get(PLACES_URL % {lat: lat, lng: lng, limit: limit,
                                          city: URI.escape(city)},
    format: :json)
    #require 'pry'; binding.pry
    response['response']['venues']
  end

  def places_wikiloc(limit)
    lat, lng = coords.split(',')
    response = HTTParty.get(PLACES_URL % {lat: lat, lng: lng, limit: limit},
                            format: :json)
    #require 'pry'; binding.pry
    response['articles']
  end

  def self.fetch_coords(city)
    yql = Yql::Client.new
    q = YqlQuery::Builder.new

    q.table('geo.places').
      conditions("text = '%{city}'" % {city: city})

    yql.query = q.to_s
    yql.format = :json
    response = yql.get

    c =JSON.parse(response.show)['query']['results']['place'].first['centroid']

    return "#{c['latitude']},#{c['longitude']}"
  end

  def redis
    @redis ||= ENV['REDISCLOUD_URL'] ? Redis.new(ENV['REDISCLOUD_URL']) : Redis.new
  end
end

class Redis
  def cache(key, expire=nil)
    key = key.downcase.gsub(/[^a-z0-9]/, '-')
    if (value = get(key)).nil?
      value = yield(self)
      set(key, value.to_json)
      expire(key, expire) if expire
      value
    else
      JSON.parse(value)
    end
  end
end

