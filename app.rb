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

  PLACES_URL = "http://api.wikilocation.org/articles?lat=%{lat}&lng=%{lng}&type=landmark&limit=%{limit}"

  def places(limit=5)
    places_wikiloc(limit).map do |place|
      place['photos'] = photos(place)
      place
    end
  end

  def photos(place)
    photos = flickr.photos.search(sort: 'interestingness-desc',
                                  lat: place['lat'],
                                  lon: place['lng'],
                                  per_page: 10,
                                  radius: 0.1)

    photos.map do |photo|
      FlickRaw.url_b(photo)
    end
  end

  def places_wikiloc(limit)
    lat, lng = coords.split(',')
    puts coords
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

