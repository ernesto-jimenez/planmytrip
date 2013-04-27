require 'rubygems'
require 'sinatra'
require 'haml'
require 'json'
require 'yql-query'
require 'yql'
require 'httparty'
require 'flickraw'

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
  PLACES_URL = "https://api.foursquare.com/v2/venues/search?near=%{city}&categoryId=5032792091d4c4b30a586d5c,4deefb944765f83613cdba6e,4bf58dd8d48988d181941735,4bf58dd8d48988d1e5931735,4bf58dd8d48988d184941735,4bf58dd8d48988d182941735,4bf58dd8d48988d1e2941735,50aaa49e4b90af0d42d5de11,50aaa4314b90af0d42d5de10,4bf58dd8d48988d161941735,4bf58dd8d48988d15d941735,4eb1d4dd4b900d56c88a45fd,4bf58dd8d48988d126941735&oauth_token=LNE0NIZDYMP2TYW3NOIML43A4THTIX44YZVPIWDF3PCTEWVU&v=20130427"

  def places(limit=5)
    places_4sq(limit).map do |place|
      place['photos'] = photos(place)
      place
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
      FlickRaw.url_m(photo)
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
end

